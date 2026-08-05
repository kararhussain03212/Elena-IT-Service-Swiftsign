<?php
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = urldecode((string) ($_GET['asset'] ?? $requestPath));
if (PHP_SAPI !== 'cli-server') {
    // The built-in dev server sets SCRIPT_NAME to the requested path itself for
    // routes that fall through to this router, which makes dirname() strip the
    // real request path (e.g. "/uploads") as if it were a deployment subpath.
    $scriptDir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? ''))), '/');
    if ($scriptDir !== '' && $scriptDir !== '/' && strpos($path, $scriptDir . '/') === 0) {
        $path = substr($path, strlen($scriptDir));
    }
}
$path = $path === '' ? '/' : $path;

$candidatePaths = [];
if ($path !== '/') {
    $candidatePaths[] = __DIR__ . $path;
    if (preg_match('#^/uploads/#', $path)) {
        $candidatePaths[] = __DIR__ . '/../' . ltrim($path, '/');
    }
}

foreach ($candidatePaths as $fullPath) {
    if (file_exists($fullPath) && !is_dir($fullPath)) {
        $mime = function_exists('mime_content_type') ? mime_content_type($fullPath) : 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        return true;
    }
}

require __DIR__ . '/index.php';
