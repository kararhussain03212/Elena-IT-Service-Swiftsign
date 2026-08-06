<?php
// Never let PHP notices/warnings/deprecations leak into an API response body —
// on a host where php.ini has display_errors on, an inline warning (e.g. an
// "undefined array key" notice) gets printed before the JSON payload and
// corrupts it for every client that parses the response as JSON. Log instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/helpers.php';
require_once __DIR__ . '/utils/request_context.php';

set_exception_handler(function (Throwable $exception) {
    $message = $exception->getMessage();
    $isDbConnectionError =
        $exception instanceof PDOException
        && (stripos($message, 'SQLSTATE[HY000] [2002]') !== false || stripos($message, 'Connection refused') !== false);
    $isMissingTableError =
        $exception instanceof PDOException
        && (stripos($message, 'SQLSTATE[42S02]') !== false || stripos($message, "Base table or view not found") !== false);

    if ($isDbConnectionError) {
        error_response(503, 'Database is unavailable. Start MySQL (XAMPP) and verify backend/.env database settings.');
    }
    if ($isMissingTableError) {
        error_response(503, 'Database schema is missing. Import your SQL schema or run backend migration/seed scripts on the server.');
    }

    error_response(500, 'Internal server error.', ['details' => $message]);
});

function should_run_bootstrap_initializers(): bool
{
    $force = strtolower((string) env('BOOTSTRAP_INIT_EACH_REQUEST', ''));
    if (in_array($force, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }

    if (PHP_SAPI === 'cli' || PHP_SAPI === 'phpdbg' || PHP_SAPI === 'cli-server') {
        return true;
    }

    $appEnv = strtolower((string) env('APP_ENV', 'production'));
    return in_array($appEnv, ['local', 'development', 'dev'], true);
}

if (should_run_bootstrap_initializers()) {
    try {
        $initializersPath = __DIR__ . '/utils/initializers.php';
        if (file_exists($initializersPath)) {
            require_once $initializersPath;
            if (function_exists('ensure_default_roles')) {
                ensure_default_roles();
            }
            if (function_exists('ensure_default_admin_user')) {
                ensure_default_admin_user();
            }
        } else {
            error_log('[bootstrap] initializers.php not found. Skipping default seed.');
        }
    } catch (Throwable $exception) {
        // Bootstrapping defaults should not block public API reads in production.
        error_log('[bootstrap] Default seed skipped: ' . $exception->getMessage());
    }
}
