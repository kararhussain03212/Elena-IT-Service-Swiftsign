<?php
$baseEnvFile = __DIR__ . '/../.env';
$cpanelEnvFile = __DIR__ . '/../.env.cpanel';

$hasBaseEnv = file_exists($baseEnvFile);
$hasCpanelEnv = file_exists($cpanelEnvFile);

if (!$hasBaseEnv && !$hasCpanelEnv) {
    throw new RuntimeException('Missing .env file. Expected .env or .env.cpanel.');
}

$serverAppEnv = strtolower(trim((string) ($_SERVER['APP_ENV'] ?? getenv('APP_ENV') ?: '')));
$httpHost = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? ''))));
$isLocalHost = $httpHost !== '' && preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/', $httpHost) === 1;
$isCliLike = in_array(PHP_SAPI, ['cli', 'phpdbg', 'cli-server'], true);

$shouldLoadCpanel = false;
if ($hasCpanelEnv) {
    $shouldLoadCpanel = !$hasBaseEnv
        || in_array($serverAppEnv, ['production', 'cpanel'], true)
        || (!$isCliLike && !$isLocalHost);
}

$envFiles = [];
if ($hasBaseEnv) {
    $envFiles[] = $baseEnvFile;
}
if ($shouldLoadCpanel) {
    $envFiles[] = $cpanelEnvFile;
}

foreach ($envFiles as $envFile) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        [$name, $value] = array_pad(preg_split('/\s*=\s*/', $line, 2), 2, '');
        $name = trim($name);
        $value = rtrim($value, "\r\n");

        if ($name === '') {
            continue;
        }

        if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
            $value = substr($value, 1, -1);
        }

        // Non-empty values from .env.cpanel override .env; blank values do not erase existing values.
        if ($value === '' && isset($_ENV[$name])) {
            continue;
        }

        $_ENV[$name] = $_SERVER[$name] = $value;
    }
}

function env(string $key, $default = null)
{
    return $_ENV[$key] ?? $default;
}
