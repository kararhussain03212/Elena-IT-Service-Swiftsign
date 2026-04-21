<?php
require_once __DIR__ . '/../config/env.php';

function build_contact_email_body(array $message): string
{
    $lines = [
        'New contact form submission',
        '',
        'Name: ' . ($message['name'] ?? '-'),
        'Email: ' . ($message['email'] ?? '-'),
        'Phone: ' . ($message['phone'] ?? '-'),
        'Subject: ' . ($message['subject'] ?? 'Website Contact Form'),
        '',
        'Message:',
        $message['message'] ?? '',
        '',
        'Submitted At: ' . ($message['created_at'] ?? date('c')),
        'IP Address: ' . ($message['ip_address'] ?? '-'),
    ];
    return implode("\n", $lines);
}

function smtp_read_response($socket): string
{
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }
        $response .= $line;
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }
    return trim($response);
}

function smtp_expect_code(string $response, array $allowedCodes): bool
{
    $code = (int) substr($response, 0, 3);
    return in_array($code, $allowedCodes, true);
}

function smtp_write_command($socket, string $command): void
{
    fwrite($socket, $command . "\r\n");
}

function smtp_env_bool($value, bool $default = false): bool
{
    if (is_bool($value)) {
        return $value;
    }

    $normalized = strtolower(trim((string) $value));
    if ($normalized === '') {
        return $default;
    }

    if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }

    if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
        return false;
    }

    return $default;
}

function send_via_smtp(array $message): array
{
    $host = trim((string) env('SMTP_HOST', ''));
    $port = (int) env('SMTP_PORT', 587);
    $username = trim((string) env('SMTP_USERNAME', ''));
    $password = (string) env('SMTP_PASSWORD', '');
    $encryption = strtolower(trim((string) env('SMTP_ENCRYPTION', 'tls')));
    $timeout = (int) env('SMTP_TIMEOUT', 15);
    $forceAuthFrom = smtp_env_bool(env('SMTP_FORCE_AUTH_FROM', '1'), true);
    $allowSelfSigned = smtp_env_bool(env('SMTP_ALLOW_SELF_SIGNED', '1'), true);

    if ($host === '') {
        return ['sent' => false, 'reason' => 'SMTP_HOST is not configured.'];
    }

    $to = trim((string) env('CONTACT_RECEIVER_EMAIL', ''));
    if ($to === '') {
        return ['sent' => false, 'reason' => 'CONTACT_RECEIVER_EMAIL is not configured.'];
    }

    $fromName = trim((string) env('SMTP_FROM_NAME', 'Swift Sign IT'));
    $fromEmail = trim((string) env('SMTP_FROM_EMAIL', $username !== '' ? $username : 'no-reply@swiftsignit.com'));
    $envelopeFrom = trim((string) env('SMTP_ENVELOPE_FROM', $username !== '' ? $username : $fromEmail));

    // Most shared SMTP servers require sender identity to match authenticated user.
    if ($forceAuthFrom && $username !== '') {
        $fromEmail = $username;
        $envelopeFrom = $username;
    }
    if ($envelopeFrom === '') {
        $envelopeFrom = $fromEmail;
    }
    if ($fromEmail === '') {
        $fromEmail = $envelopeFrom;
    }
    $subject = sprintf('New Contact Message from %s', $message['name'] ?? 'anonymous');
    $body = build_contact_email_body($message);

    $hostCandidates = array_values(array_filter(array_map('trim', explode(',', $host))));
    $socket = null;
    $connectErrors = [];

    foreach ($hostCandidates as $candidateHost) {
        $transportHost = $candidateHost;
        if ($encryption === 'ssl') {
            $transportHost = 'ssl://' . $candidateHost;
        }

        $lastWarning = '';
        set_error_handler(function ($severity, $messageText) use (&$lastWarning) {
            $lastWarning = (string) $messageText;
            return true;
        });

        $context = null;
        if ($encryption === 'ssl' || $encryption === 'tls') {
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => !$allowSelfSigned,
                    'verify_peer_name' => !$allowSelfSigned,
                    'allow_self_signed' => $allowSelfSigned,
                ],
            ]);
        }

        $socket = stream_socket_client(
            sprintf('%s:%d', $transportHost, $port),
            $errno,
            $errstr,
            max(5, $timeout),
            STREAM_CLIENT_CONNECT,
            $context
        );

        restore_error_handler();

        if ($socket) {
            $host = $candidateHost;
            break;
        }

        $parts = [];
        if ($errstr !== '') {
            $parts[] = $errstr;
        }
        if ($errno !== 0) {
            $parts[] = 'code ' . $errno;
        }
        if ($lastWarning !== '') {
            $parts[] = $lastWarning;
        }
        $details = implode(' | ', $parts);
        if ($details === '') {
            $details = 'no socket error details available';
        }

        $connectErrors[] = $candidateHost . ':' . $port . ' -> ' . $details;
    }

    if (!$socket) {
        return ['sent' => false, 'reason' => 'SMTP connection failed: ' . implode(' ; ', $connectErrors)];
    }

    stream_set_timeout($socket, max(5, $timeout));

    $greeting = smtp_read_response($socket);
    if (!smtp_expect_code($greeting, [220])) {
        fclose($socket);
        return ['sent' => false, 'reason' => 'SMTP greeting failed: ' . $greeting];
    }

    $localHost = $_SERVER['SERVER_NAME'] ?? 'localhost';

    smtp_write_command($socket, 'EHLO ' . $localHost);
    $ehlo = smtp_read_response($socket);
    if (!smtp_expect_code($ehlo, [250])) {
        smtp_write_command($socket, 'HELO ' . $localHost);
        $helo = smtp_read_response($socket);
        if (!smtp_expect_code($helo, [250])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP EHLO/HELO failed: ' . $ehlo];
        }
    }

    if ($encryption === 'tls') {
        smtp_write_command($socket, 'STARTTLS');
        $starttls = smtp_read_response($socket);
        if (!smtp_expect_code($starttls, [220])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP STARTTLS failed: ' . $starttls];
        }

        $cryptoEnabled = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($cryptoEnabled !== true) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP TLS negotiation failed.'];
        }

        smtp_write_command($socket, 'EHLO ' . $localHost);
        $ehloTls = smtp_read_response($socket);
        if (!smtp_expect_code($ehloTls, [250])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP EHLO after TLS failed: ' . $ehloTls];
        }
    }

    if ($username !== '' || $password !== '') {
        smtp_write_command($socket, 'AUTH LOGIN');
        $authPrompt = smtp_read_response($socket);
        if (!smtp_expect_code($authPrompt, [334])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP AUTH LOGIN failed: ' . $authPrompt];
        }

        smtp_write_command($socket, base64_encode($username));
        $userPrompt = smtp_read_response($socket);
        if (!smtp_expect_code($userPrompt, [334])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP username rejected: ' . $userPrompt];
        }

        smtp_write_command($socket, base64_encode($password));
        $authResult = smtp_read_response($socket);
        if (!smtp_expect_code($authResult, [235])) {
            fclose($socket);
            return ['sent' => false, 'reason' => 'SMTP password rejected: ' . $authResult];
        }
    }

    smtp_write_command($socket, 'MAIL FROM:<' . $envelopeFrom . '>');
    $mailFrom = smtp_read_response($socket);
    if (!smtp_expect_code($mailFrom, [250])) {
        fclose($socket);
        return ['sent' => false, 'reason' => 'SMTP MAIL FROM failed: ' . $mailFrom];
    }

    smtp_write_command($socket, 'RCPT TO:<' . $to . '>');
    $rcptTo = smtp_read_response($socket);
    if (!smtp_expect_code($rcptTo, [250, 251])) {
        fclose($socket);
        return ['sent' => false, 'reason' => 'SMTP RCPT TO failed: ' . $rcptTo];
    }

    smtp_write_command($socket, 'DATA');
    $dataResponse = smtp_read_response($socket);
    if (!smtp_expect_code($dataResponse, [354])) {
        fclose($socket);
        return ['sent' => false, 'reason' => 'SMTP DATA command failed: ' . $dataResponse];
    }

    $headers = [];
    $headers[] = sprintf('From: %s <%s>', $fromName, $fromEmail);
    if (!empty($message['email'])) {
        $headers[] = 'Reply-To: ' . $message['email'];
    }
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Date: ' . date(DATE_RFC2822);
    $headers[] = 'Subject: ' . $subject;

    $normalizedBody = str_replace(["\r\n", "\r"], "\n", $body);
    $normalizedBody = preg_replace('/^\./m', '..', $normalizedBody);
    $messageData = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $normalizedBody) . "\r\n.";
    smtp_write_command($socket, $messageData);

    $sendResult = smtp_read_response($socket);
    if (!smtp_expect_code($sendResult, [250])) {
        fclose($socket);
        return ['sent' => false, 'reason' => 'SMTP send failed: ' . $sendResult];
    }

    smtp_write_command($socket, 'QUIT');
    smtp_read_response($socket);
    fclose($socket);

    return ['sent' => true];
}

function send_contact_message_email(array $message): array
{
    $to = env('CONTACT_RECEIVER_EMAIL', '');
    if ($to === '') {
        return ['sent' => false, 'reason' => 'CONTACT_RECEIVER_EMAIL is not configured.'];
    }

    $smtpHost = trim((string) env('SMTP_HOST', ''));
    if ($smtpHost !== '') {
        return send_via_smtp($message);
    }

    $subject = sprintf('New Contact Message from %s', $message['name'] ?? 'anonymous');
    $body = build_contact_email_body($message);
    $headers = [];
    $fromName = env('SMTP_FROM_NAME', 'Swift Sign IT');
    $fromEmail = env('SMTP_FROM_EMAIL', env('SMTP_USER', 'no-reply@swiftsignit.com'));
    $headers[] = sprintf('From: %s <%s>', $fromName, $fromEmail);
    if (!empty($message['email'])) {
        $headers[] = 'Reply-To: ' . $message['email'];
    }
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';

    $sent = mail($to, $subject, $body, implode("\r\n", $headers));
    return ['sent' => $sent];
}
