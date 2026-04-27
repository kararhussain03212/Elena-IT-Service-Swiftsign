<?php
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/helpers.php';
require_once __DIR__ . '/utils/request_context.php';

set_exception_handler(function (Throwable $exception) {
    $message = $exception->getMessage();
    $isDbConnectionError =
        $exception instanceof PDOException
        && (stripos($message, 'SQLSTATE[HY000] [2002]') !== false || stripos($message, 'Connection refused') !== false);

    if ($isDbConnectionError) {
        error_response(503, 'Database is unavailable. Start MySQL (XAMPP) and verify backend/.env database settings.');
    }

    error_response(500, 'Internal server error.', ['details' => $message]);
});

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
