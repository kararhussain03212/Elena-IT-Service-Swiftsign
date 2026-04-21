<?php
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
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
