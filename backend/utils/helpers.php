<?php
function json_response($data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function error_response(int $statusCode, string $message, array $data = []): void
{
    json_response(array_merge(['message' => $message], $data), $statusCode);
}

function parse_request_body(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $raw = trim(file_get_contents('php://input') ?: '');
    if (stripos($contentType, 'application/json') !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }
    }
    return $_POST;
}

function parse_boolean($value, bool $fallback = false): bool
{
    if ($value === null || $value === '') {
        return $fallback;
    }
    if (is_bool($value)) {
        return $value;
    }
    $normalized = strtolower(trim((string) $value));
    if (in_array($normalized, ['true', '1', 'yes', 'on'], true)) {
        return true;
    }
    if (in_array($normalized, ['false', '0', 'no', 'off'], true)) {
        return false;
    }
    return $fallback;
}

function parse_integer($value, int $fallback = 0): int
{
    if ($value === null || $value === '') {
        return $fallback;
    }
    $parsed = filter_var($value, FILTER_VALIDATE_INT);
    return $parsed === false ? $fallback : $parsed;
}

function sanitize_string($value, string $fallback = ''): string
{
    $value = trim((string) ($value ?? ''));
    return $value === '' ? $fallback : $value;
}

function get_authorization_header(): ?string
{
    $headers = [];
    foreach (['HTTP_AUTHORIZATION', 'Authorization'] as $key) {
        if (!empty($_SERVER[$key])) {
            return trim($_SERVER[$key]);
        }
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $header => $value) {
            if (strtolower($header) === 'authorization') {
                return trim($value);
            }
        }
    }
    return null;
}

function ensure_uploaded_directory(string $relativePath): string
{
    // Store uploads under backend/public/uploads so frontend can access via /uploads/*
    $target = __DIR__ . '/../public/' . ltrim($relativePath, '/');
    $directory = dirname($target);
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    return $target;
}

function sanitize_upload_filename(string $originalName): string
{
    $originalName = trim($originalName);
    if ($originalName === '') {
        return 'file.bin';
    }

    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $base = pathinfo($originalName, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9._-]+/', '-', (string) $base);
    $base = trim((string) $base, '-_.');
    if ($base === '') {
        $base = 'file';
    }
    if ($extension === '') {
        $extension = 'bin';
    }

    return $base . '.' . $extension;
}

function resolve_unique_upload_filename(string $subFolder, string $fileName): string
{
    $subFolder = trim($subFolder, '/');
    $extension = pathinfo($fileName, PATHINFO_EXTENSION);
    $base = pathinfo($fileName, PATHINFO_FILENAME);

    $candidate = $fileName;
    $counter = 1;
    while (true) {
        $relative = $subFolder . '/' . $candidate;
        $target = __DIR__ . '/../public/' . ltrim($relative, '/');
        if (!file_exists($target)) {
            return $candidate;
        }
        $candidate = $base . '-' . $counter . ($extension !== '' ? '.' . $extension : '');
        $counter++;
    }
}

function handle_file_upload(string $field, string $subFolder = 'uploads'): ?array
{
    if (empty($_FILES[$field])) {
        return null;
    }

    $errorCode = (int) ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($errorCode === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($errorCode !== UPLOAD_ERR_OK) {
        $errorMap = [
            UPLOAD_ERR_INI_SIZE => 'Uploaded file exceeds server upload_max_filesize.',
            UPLOAD_ERR_FORM_SIZE => 'Uploaded file exceeds form MAX_FILE_SIZE.',
            UPLOAD_ERR_PARTIAL => 'Uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Server is missing a temporary upload directory.',
            UPLOAD_ERR_CANT_WRITE => 'Server failed to write uploaded file to disk.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
        ];
        $message = $errorMap[$errorCode] ?? ('File upload failed with error code ' . $errorCode . '.');
        error_response(400, $message, ['field' => $field, 'code' => $errorCode]);
    }

    $originalName = (string) ($_FILES[$field]['name'] ?? '');
    $filename = sanitize_upload_filename($originalName);
    $filename = resolve_unique_upload_filename($subFolder, $filename);
    $relative = trim($subFolder, '/') . '/' . $filename;
    $destination = ensure_uploaded_directory($relative);

    if (!move_uploaded_file($_FILES[$field]['tmp_name'], $destination)) {
        error_response(500, 'Uploaded file could not be moved into uploads directory.', ['field' => $field]);
    }

    return [
        'filename' => $filename,
        'original_name' => $originalName,
        'path' => $relative,
        'url' => '/' . $relative,
    ];
}

function ensure_array($value): array
{
    if ($value === null) {
        return [];
    }
    if (is_array($value)) {
        return $value;
    }
    $decoded = json_decode((string) $value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : [];
}

function now(): string
{
    return (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
}

function slugify(string $value): string
{
    $value = preg_replace('/[^a-z0-9]+/i', '-', trim(strtolower($value)));
    return trim($value, '-');
}

function parse_tags($value): array
{
    if ($value === null || $value === '') {
        return [];
    }
    if (is_array($value)) {
        return array_values(array_filter(array_map('trim', $value), fn($v) => $v !== ''));
    }
    return array_values(array_filter(array_map('trim', explode(',', (string) $value)), fn($v) => $v !== ''));
}

function is_assoc_array(array $value): bool
{
    return array_keys($value) !== range(0, count($value) - 1);
}

function normalize_boolean_value($value): bool
{
    if (is_bool($value)) {
        return $value;
    }
    if (is_int($value) || is_float($value)) {
        return ((int) $value) === 1;
    }
    $raw = strtolower(trim((string) $value));
    return in_array($raw, ['1', 'true', 'yes', 'on'], true);
}

function normalize_upload_path(string $value): string
{
    $raw = trim($value);
    if ($raw === '' || preg_match('#^https?://#i', $raw)) {
        return $value;
    }

    $relative = null;
    if (preg_match('#^/uploads/#i', $raw)) {
        $relative = ltrim($raw, '/');
    } elseif (preg_match('#^uploads/#i', $raw)) {
        $relative = ltrim($raw, '/');
    } elseif (!preg_match('#/#', $raw)) {
        $relative = 'uploads/' . $raw;
    }

    if ($relative !== null) {
        $relative = ltrim($relative, '/');
        $candidates = [
            __DIR__ . '/../public/' . $relative,
            __DIR__ . '/../../' . $relative,
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                return '/' . $relative;
            }
        }

        return '';
    }

    return $raw;
}

function transform_api_response($payload)
{
    if (!is_array($payload)) {
        return $payload;
    }

    if (!is_assoc_array($payload)) {
        return array_map('transform_api_response', $payload);
    }

    $keyMap = [
        'created_at' => 'createdAt',
        'updated_at' => 'updatedAt',
        'last_login' => 'lastLogin',
        'button_text' => 'buttonText',
        'button_link' => 'buttonLink',
        'is_active' => 'isActive',
        'cover_image' => 'coverImage',
        'short_description' => 'shortDescription',
        'detail_image' => 'detailImage',
        'read_time' => 'readTime',
        'social_links' => 'socialLinks',
        'sort_order' => 'order',
        'key_name' => 'key',
        'is_read' => 'isRead',
        'read_at' => 'readAt',
        'email_sent' => 'emailSent',
        'emailed_at' => 'emailedAt',
        'email_error' => 'emailError',
        'ip_address' => 'ipAddress',
        'user_agent' => 'userAgent',
    ];

    $booleanKeys = [
        'is_active',
        'isActive',
        'published',
        'is_read',
        'isRead',
        'email_sent',
        'emailSent',
    ];
    $imageKeys = [
        'image',
        'image1',
        'mainImage',
        'smallImage',
        'detail_image',
        'detailImage',
        'cover_image',
        'coverImage',
        'avatar',
        'icon',
        'logo',
        'logoUrl',
        'video',
        'videoUrl',
    ];

    $output = [];
    foreach ($payload as $key => $value) {
        $nextValue = transform_api_response($value);
        if (in_array((string) $key, $booleanKeys, true)) {
            $nextValue = normalize_boolean_value($nextValue);
        }
        if (in_array((string) $key, $imageKeys, true) && is_string($nextValue)) {
            $nextValue = normalize_upload_path($nextValue);
        }

        $output[$key] = $nextValue;
        $mappedKey = $keyMap[$key] ?? $key;
        if ($mappedKey !== $key) {
            $output[$mappedKey] = $nextValue;
        }
    }

    if (array_key_exists('id', $payload) && !array_key_exists('_id', $output)) {
        $output['_id'] = $payload['id'];
    }

    return $output;
}

function require_data_inserter(): void
{
    static $loaded = false;
    if ($loaded || class_exists('DataInserter', false)) {
        $loaded = true;
        return;
    }

    $path = __DIR__ . '/../scripts/DataInserter.php';
    if (!file_exists($path)) {
        error_response(503, 'Data write module is unavailable. Upload backend/scripts/DataInserter.php to the server.');
    }

    require_once $path;
    $loaded = true;
}
