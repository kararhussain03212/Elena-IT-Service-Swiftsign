<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../lib/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../lib/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

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

function send_via_phpmailer(array $message, string $subjectOverride = '', string $bodyOverride = ''): array
{
    $to = trim((string) env('CONTACT_RECEIVER_EMAIL', ''));
    if ($to === '') {
        return ['sent' => false, 'reason' => 'CONTACT_RECEIVER_EMAIL is not configured.'];
    }

    $host = trim((string) env('SMTP_HOST', ''));
    $port = (int) env('SMTP_PORT', 587);
    $username = trim((string) env('SMTP_USERNAME', ''));
    $password = (string) env('SMTP_PASSWORD', '');
    $encryption = strtolower(trim((string) env('SMTP_ENCRYPTION', 'tls')));
    $timeout = (int) env('SMTP_TIMEOUT', 15);
    $allowSelfSigned = smtp_env_bool(env('SMTP_ALLOW_SELF_SIGNED', '1'), true);
    $forceAuthFrom = smtp_env_bool(env('SMTP_FORCE_AUTH_FROM', '1'), true);

    $fromName = trim((string) env('SMTP_FROM_NAME', 'Swift Sign IT'));
    $fromEmail = trim((string) env('SMTP_FROM_EMAIL', $username !== '' ? $username : 'no-reply@swiftsignit.com'));
    if ($forceAuthFrom && $username !== '') {
        $fromEmail = $username;
    }

    $subject = $subjectOverride !== '' ? $subjectOverride : sprintf('New Contact Message from %s', $message['name'] ?? 'anonymous');
    $body = $bodyOverride !== '' ? $bodyOverride : build_contact_email_body($message);

    $mail = new PHPMailer(true);

    try {
        if ($host !== '') {
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->Port = $port;
            $mail->SMTPAuth = ($username !== '' || $password !== '');
            $mail->Username = $username;
            $mail->Password = $password;
            $mail->Timeout = max(5, $timeout);

            if ($encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = '';
                $mail->SMTPAutoTLS = false;
            }

            if ($allowSelfSigned) {
                $mail->SMTPOptions = [
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true,
                    ],
                ];
            }
        } else {
            // No SMTP host configured — fall back to PHPMailer's local mail() transport.
            $mail->isMail();
        }

        $mail->CharSet = 'UTF-8';
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($to);
        // Raw SMTP submission never writes back to the sending mailbox's
        // Sent folder, so BCC the sender for a visible record of delivery.
        if ($username !== '' && filter_var($username, FILTER_VALIDATE_EMAIL) && strcasecmp($username, $to) !== 0) {
            $mail->addBCC($username);
        }
        if (!empty($message['email']) && filter_var($message['email'], FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($message['email'], (string) ($message['name'] ?? ''));
        }

        $mail->Subject = $subject;
        $mail->isHTML(false);
        $mail->Body = $body;

        $mail->send();
        return ['sent' => true];
    } catch (PHPMailerException $e) {
        return ['sent' => false, 'reason' => 'PHPMailer error: ' . $mail->ErrorInfo];
    } catch (\Throwable $e) {
        return ['sent' => false, 'reason' => 'PHPMailer error: ' . $e->getMessage()];
    }
}

function send_contact_message_email(array $message): array
{
    return send_via_phpmailer($message);
}

function build_program_application_email_body(array $application, ?string $programTitle): string
{
    $lines = [
        'New program application submitted',
        '',
        'Program: ' . ($programTitle ?? 'Unknown Program'),
        'Full Name: ' . ($application['full_name'] ?? '-'),
        'Email: ' . ($application['email'] ?? '-'),
        'Contact Number: ' . ($application['contact_number'] ?? '-'),
        'Has Basic IT/Programming Knowledge: ' . (!empty($application['has_basic_it_knowledge']) ? 'Yes' : 'No'),
        '',
        'Submitted At: ' . ($application['created_at'] ?? date('c')),
    ];
    return implode("\n", $lines);
}

function send_program_application_email(array $application, ?string $programTitle): array
{
    $subject = sprintf('New Program Application from %s', $application['full_name'] ?? 'anonymous');
    $body = build_program_application_email_body($application, $programTitle);
    return send_via_phpmailer($application, $subject, $body);
}
