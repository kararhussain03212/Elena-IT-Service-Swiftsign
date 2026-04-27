<?php
$baseEnvFile = __DIR__ . '/../.env';
$cpanelEnvFile = __DIR__ . '/../.env.cpanel';

$hasBaseEnv = file_exists($baseEnvFile);
$hasCpanelEnv = file_exists($cpanelEnvFile);

// PHP 7.x compatibility helpers (str_starts_with / str_ends_with are PHP 8+).
if (!function_exists('env_starts_with')) {
    function env_starts_with(string $haystack, string $needle): bool
    {
        if ($needle === '') {
            return true;
        }
        return substr($haystack, 0, strlen($needle)) === $needle;
    }
}

if (!function_exists('env_ends_with')) {
    function env_ends_with(string $haystack, string $needle): bool
    {
        if ($needle === '') {
            return true;
        }
        return substr($haystack, -strlen($needle)) === $needle;
    }
}

if (!$hasBaseEnv && !$hasCpanelEnv) {
    // On some cPanel deploys dotfiles are hidden/skipped during upload.
    // Do not hard-fail here; allow reading from server env vars.
    error_log('[env] No .env/.env.cpanel file found. Falling back to server environment variables.');
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
    if ($lines === false) {
        continue;
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || env_starts_with($line, '#')) {
            continue;
        }

        [$name, $value] = array_pad(preg_split('/\s*=\s*/', $line, 2), 2, '');
        $name = trim($name);
        $value = rtrim($value, "\r\n");

        if ($name === '') {
            continue;
        }

        if (env_starts_with($value, '"') && env_ends_with($value, '"')) {
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
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }
    if (array_key_exists($key, $_SERVER)) {
        return $_SERVER[$key];
    }

    $value = getenv($key);
    return $value === false ? $default : $value;
}
