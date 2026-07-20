<?php
require_once __DIR__ . '/../config/env.php';

function verify_recaptcha(string $token): bool
{
    $secret = trim((string) env('RECAPTCHA_SECRET_KEY', ''));
    if ($secret === '' || $token === '') {
        return false;
    }

    $postData = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $postData,
            'timeout' => 10,
        ],
    ]);

    $response = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    if ($response === false) {
        return false;
    }

    $result = json_decode($response, true);
    return (bool) ($result['success'] ?? false);
}
