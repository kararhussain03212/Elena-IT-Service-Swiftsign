<?php
require_once __DIR__ . '/../config/env.php';

function jwt_encode(array $payload): string
{
    $secret = env('JWT_SECRET', 'please-generate-a-secret');
    $expiry = parse_duration(env('JWT_EXPIRE', '7d'));

    $data = array_merge([
        'iat' => time(),
        'exp' => time() + $expiry,
    ], $payload);

    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = base64url_encode(json_encode($data));
    $signature = hash_hmac('sha256', "$header.$body", $secret, true);

    return implode('.', [$header, $body, base64url_encode($signature)]);
}

function jwt_decode(string $token): ?array
{
    $secret = env('JWT_SECRET', 'please-generate-a-secret');
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $decoded = json_decode(base64url_decode($payload), true);
    if (!is_array($decoded)) {
        return null;
    }

    if (isset($decoded['exp']) && time() >= $decoded['exp']) {
        return null;
    }

    return $decoded;
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $padding = 4 - (strlen($data) % 4);
    if ($padding !== 4) {
        $data .= str_repeat('=', $padding);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function parse_duration(string $value): int
{
    $value = trim(strtolower($value));
    if ($value === '') {
        return 604800;
    }

    if (is_numeric($value)) {
        return (int) $value;
    }

    $unit = substr($value, -1);
    $amount = (int) substr($value, 0, -1);

    switch ($unit) {
        case 'h':
            return $amount * 3600;
        case 'd':
            return $amount * 86400;
        case 'm':
            return $amount * 60;
        default:
            return 604800;
    }
}
