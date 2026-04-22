<?php
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/helpers.php';
require_once __DIR__ . '/utils/request_context.php';
require_once __DIR__ . '/utils/initializers.php';

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
    ensure_default_roles();
    ensure_default_admin_user();
} catch (Throwable $exception) {
    // Bootstrapping defaults should not block public API reads in production.
    error_log('[bootstrap] Default seed skipped: ' . $exception->getMessage());
}
