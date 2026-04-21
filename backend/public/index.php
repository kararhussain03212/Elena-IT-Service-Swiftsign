<?php
require_once __DIR__ . '/../config/env.php';

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

require_once __DIR__ . '/../bootstrap.php';

$router = require __DIR__ . '/../routes/api.php';
$routeOverride = $_GET['route'] ?? '';
$path = is_string($routeOverride) && $routeOverride !== ''
    ? $routeOverride
    : parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$router->dispatch($_SERVER['REQUEST_METHOD'], $path);
