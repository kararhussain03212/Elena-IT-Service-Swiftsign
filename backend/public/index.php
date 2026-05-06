<?php
require_once __DIR__ . '/../config/env.php';

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('Cross-Origin-Resource-Policy: same-origin');
if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

$routeOverride = $_GET['route'] ?? '';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$scriptDir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? ''))), '/');
if ($scriptDir !== '' && $scriptDir !== '/' && strpos($requestPath, $scriptDir . '/') === 0) {
    $requestPath = substr($requestPath, strlen($scriptDir));
}
$effectivePath = (is_string($routeOverride) && $routeOverride !== '') ? $routeOverride : ($requestPath === '' ? '/' : $requestPath);

// cPanel diagnostics endpoint: enable with APP_DEBUG=1 (or APP_ENV=local).
if ($effectivePath === '/api/health') {
    $appDebug = strtolower((string) env('APP_DEBUG', '0'));
    $appEnv = strtolower((string) env('APP_ENV', 'production'));
    $debugEnabled = in_array($appDebug, ['1', 'true', 'yes', 'on'], true) || $appEnv === 'local';

    if (!$debugEnabled) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['message' => 'Not found'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $tables = ['users', 'sliders', 'team_members', 'testimonials', 'blogs', 'section_contents'];
    $status = [
        'ok' => true,
        'phpVersion' => PHP_VERSION,
        'phpVersionId' => PHP_VERSION_ID,
        'appEnv' => (string) env('APP_ENV', 'production'),
        'appDebug' => (string) env('APP_DEBUG', '0'),
        'db' => [
            'host' => (string) env('MYSQL_HOST', env('DB_HOST', '')),
            'port' => (string) env('MYSQL_PORT', env('DB_PORT', '')),
            'database' => (string) env('MYSQL_DATABASE', env('DB_NAME', '')),
            'connected' => false,
            'error' => null,
        ],
        'tables' => [],
    ];

    if (PHP_VERSION_ID < 70400) {
        $status['ok'] = false;
        $status['db']['error'] = 'PHP version is too old. Use PHP 7.4+ (recommended 8.1+).';
    } else {
        try {
            require_once __DIR__ . '/../config/database.php';
            $pdo = Database::connection();
            $status['db']['connected'] = true;

            foreach ($tables as $table) {
                $stmt = $pdo->prepare(
                    'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
                );
                $stmt->execute(['table' => $table]);
                $status['tables'][$table] = (bool) $stmt->fetchColumn();
            }
        } catch (Throwable $exception) {
            $status['ok'] = false;
            $status['db']['error'] = $exception->getMessage();
        }
    }

    http_response_code($status['ok'] ? 200 : 503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($status, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$configuredOrigins = (string) env('CORS_ALLOWED_ORIGINS', '');
$parsedOrigins = array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))));
$allowedOrigins = !empty($parsedOrigins) ? $parsedOrigins : [
    'https://it.swiftsignbm.com',
    'https://www.it.swiftsignbm.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

$isLocalDevOrigin = preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin) === 1;
$isAllowedOrigin = in_array($origin, $allowedOrigins, true) || $isLocalDevOrigin;

$allowOrigin = $isAllowedOrigin ? $origin : '*';
header('Vary: Origin, Access-Control-Request-Headers, Access-Control-Request-Method');
header('Access-Control-Allow-Origin: ' . $allowOrigin);
if ($allowOrigin !== '*') {
    header('Access-Control-Allow-Credentials: true');
}

$allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-User-Role',
    'X-Requested-With',
    'Accept',
    'Origin',
];
$requestedHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
if ($requestedHeaders !== '') {
    foreach (explode(',', $requestedHeaders) as $requestedHeader) {
        $requestedHeader = trim($requestedHeader);
        if ($requestedHeader === '' || !preg_match('/^[a-zA-Z0-9-]+$/', $requestedHeader)) {
            continue;
        }
        if (!in_array(strtolower($requestedHeader), array_map('strtolower', $allowedHeaders), true)) {
            $allowedHeaders[] = $requestedHeader;
        }
    }
}
header('Access-Control-Allow-Headers: ' . implode(', ', $allowedHeaders));
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    require_once __DIR__ . '/../bootstrap.php';

    $router = require __DIR__ . '/../routes/api.php';
    $router->dispatch($_SERVER['REQUEST_METHOD'], $effectivePath);
} catch (Throwable $exception) {
    error_log('[api] Fatal bootstrap/router error: ' . $exception->getMessage());
    if (function_exists('error_response')) {
        error_response(500, 'Internal server error.', ['details' => $exception->getMessage()]);
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Internal server error.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
