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

// Only ever serve a file out of two known-safe directories: this public/ dir itself
// (real static assets) and the sibling uploads/ dir (legacy upload files, reached via
// the "asset" query param that the Vite dev proxy's /uploads rewrite sends). Both
// candidates are resolved with realpath() and re-checked against their base directory
// so a "../" segment — whether from REQUEST_URI or from the attacker-controlled
// "asset" query param — can never escape to read arbitrary files such as
// config/database.php or ../.env. PHP files are never served as static content.
function resolve_static_candidate(string $baseDir, string $relativePath): ?string
{
    $base = realpath($baseDir);
    if ($base === false) {
        return null;
    }
    $full = realpath($baseDir . '/' . ltrim($relativePath, '/'));
    if ($full === false || $full === $base) {
        return null;
    }
    if (strpos($full, $base . DIRECTORY_SEPARATOR) !== 0) {
        return null;
    }
    if (strtolower(pathinfo($full, PATHINFO_EXTENSION)) === 'php') {
        return null;
    }
    return $full;
}

$candidatePaths = [];
if ($path !== '/' && $path !== '/index.php' && $path !== '/router.php') {
    $inPublic = resolve_static_candidate(__DIR__, $path);
    if ($inPublic !== null) {
        $candidatePaths[] = $inPublic;
    }
    if (preg_match('#^/uploads/#', $path)) {
        $inUploads = resolve_static_candidate(__DIR__ . '/..', $path);
        if ($inUploads !== null) {
            $candidatePaths[] = $inUploads;
        }
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
