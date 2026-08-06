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
    // Store uploads under backend/uploads
    $target = __DIR__ . '/../' . ltrim($relativePath, '/');
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
        $target = __DIR__ . '/../' . ltrim($relative, '/');
        if (!file_exists($target)) {
            return $candidate;
        }
        $candidate = $base . '-' . $counter . ($extension !== '' ? '.' . $extension : '');
        $counter++;
    }
}

function detect_uploaded_image_type(string $tmpFile): ?string
{
    if (!is_file($tmpFile)) {
        return null;
    }

    if (function_exists('exif_imagetype')) {
        $imageType = @exif_imagetype($tmpFile);
        if ($imageType === IMAGETYPE_JPEG) {
            return 'jpeg';
        }
        if ($imageType === IMAGETYPE_PNG) {
            return 'png';
        }
    }

    $imageInfo = @getimagesize($tmpFile);
    $mimeFromImageSize = strtolower((string) ($imageInfo['mime'] ?? ''));
    if ($mimeFromImageSize === 'image/jpeg') {
        return 'jpeg';
    }
    if ($mimeFromImageSize === 'image/png') {
        return 'png';
    }

    if (function_exists('finfo_open')) {
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = (string) @finfo_file($finfo, $tmpFile);
            @finfo_close($finfo);
            if ($mime === 'image/jpeg') {
                return 'jpeg';
            }
            if ($mime === 'image/png') {
                return 'png';
            }
            if ($mime === 'image/webp') {
                return 'webp';
            }
        }
    }

    return null;
}

function convert_image_to_webp(string $source, string $destination, string $sourceType, int $quality = 80): bool
{
    $quality = max(1, min(100, $quality));

    if (class_exists('Imagick')) {
        try {
            $imagick = new Imagick();
            $imagick->readImage($source);
            if ($imagick->getNumberImages() > 1) {
                $imagick = $imagick->coalesceImages();
            }
            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality($quality);
            $result = $imagick->writeImage($destination);
            $imagick->clear();
            $imagick->destroy();
            if ($result && file_exists($destination) && filesize($destination) > 0) {
                return true;
            }
        } catch (Throwable $e) {
            // Fall back to GD when Imagick fails.
        }
    }

    if (!function_exists('imagewebp')) {
        return false;
    }

    $image = null;
    if ($sourceType === 'jpeg' && function_exists('imagecreatefromjpeg')) {
        $image = @imagecreatefromjpeg($source);
    } elseif ($sourceType === 'png' && function_exists('imagecreatefrompng')) {
        $image = @imagecreatefrompng($source);
        if ($image) {
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }
    }

    if (!$image) {
        return false;
    }

    $result = @imagewebp($image, $destination, $quality);
    imagedestroy($image);
    return $result && file_exists($destination) && filesize($destination) > 0;
}

function get_webp_capability_report(): array
{
    $gdLoaded = extension_loaded('gd');
    $gdInfo = $gdLoaded && function_exists('gd_info') ? gd_info() : [];
    $gdWebpSupport = (bool) ($gdInfo['WebP Support'] ?? false);
    $gdCanEncode = $gdLoaded && function_exists('imagewebp') && $gdWebpSupport;

    $imagickLoaded = extension_loaded('imagick') && class_exists('Imagick');
    $imagickWebpSupport = false;
    if ($imagickLoaded) {
        try {
            $formats = array_map('strtoupper', Imagick::queryFormats('WEBP'));
            $imagickWebpSupport = in_array('WEBP', $formats, true);
        } catch (Throwable $e) {
            $imagickWebpSupport = false;
        }
    }

    $canConvert = $gdCanEncode || $imagickWebpSupport;

    return [
        'canConvert' => $canConvert,
        'phpVersion' => PHP_VERSION,
        'engines' => [
            'gd' => [
                'loaded' => $gdLoaded,
                'webpSupport' => $gdWebpSupport,
                'canEncode' => $gdCanEncode,
            ],
            'imagick' => [
                'loaded' => $imagickLoaded,
                'webpSupport' => $imagickWebpSupport,
                'canEncode' => $imagickWebpSupport,
            ],
        ],
    ];
}

function handle_file_upload(string $field, string $subFolder = 'uploads'): ?array
{
    $maxBytes = 8 * 1024 * 1024; // 8 MB
    $webpQuality = 80;

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

    $tmpFile = (string) ($_FILES[$field]['tmp_name'] ?? '');
    $fileSize = (int) ($_FILES[$field]['size'] ?? 0);
    if ($tmpFile === '' || !is_uploaded_file($tmpFile)) {
        error_response(400, 'Uploaded file is invalid.', ['field' => $field]);
    }
    if ($fileSize <= 0) {
        error_response(400, 'Uploaded file is empty.', ['field' => $field]);
    }
    if ($fileSize > $maxBytes) {
        error_response(400, 'Uploaded file exceeds the maximum size of 8 MB.', ['field' => $field]);
    }

    $originalName = (string) ($_FILES[$field]['name'] ?? '');
    $sanitized = sanitize_upload_filename($originalName);
    $imageType = detect_uploaded_image_type($tmpFile);

    // Only the slider "video" field legitimately needs a non-image upload. Every other
    // field on every controller is a picture, so anything that isn't a real detected
    // image (jpeg/png/webp, verified from file content, never from the client-supplied
    // Content-Type/filename) is rejected outright. This closes an arbitrary-file-upload
    // hole where a client could omit/spoof the "image/*" Content-Type to make an
    // upload of any extension (.php, .svg, .html, ...) fall through unfiltered.
    if (in_array($imageType, ['jpeg', 'png', 'webp'], true) === false) {
        if ($field === 'video') {
            return handle_video_upload($field, $subFolder, $tmpFile, $originalName);
        }
        error_response(400, 'Only JPG, JPEG, PNG, and WebP images are allowed.', ['field' => $field]);
    }

    // Image uploads: always convert/store as WebP.
    if (in_array($imageType, ['jpeg', 'png', 'webp'], true)) {
        $base = pathinfo($sanitized, PATHINFO_FILENAME);
        if ($imageType === 'webp') {
            $webpFilename = resolve_unique_upload_filename($subFolder, $base . '.webp');
            $webpRelative = trim($subFolder, '/') . '/' . $webpFilename;
            $webpDestination = ensure_uploaded_directory($webpRelative);
            if (!move_uploaded_file($tmpFile, $webpDestination)) {
                error_response(500, 'Uploaded image could not be saved.', ['field' => $field]);
            }
            return [
                'filename' => $webpFilename,
                'original_name' => $originalName,
                'path' => $webpRelative,
                'url' => '/' . $webpRelative,
            ];
        }

        $webpFilename = resolve_unique_upload_filename($subFolder, $base . '.webp');
        $webpRelative = trim($subFolder, '/') . '/' . $webpFilename;
        $webpDestination = ensure_uploaded_directory($webpRelative);

        if (convert_image_to_webp($tmpFile, $webpDestination, (string) $imageType, $webpQuality)) {
            return [
                'filename' => $webpFilename,
                'original_name' => $originalName,
                'path' => $webpRelative,
                'url' => '/' . $webpRelative,
            ];
        }

        error_response(500, 'WebP conversion failed. Enable GD (with WebP) or Imagick on the server.', ['field' => $field]);
    }

    // Unreachable: every non-"video" field either matched a real image type above
    // (and returned) or was rejected before this point.
    error_response(400, 'Only JPG, JPEG, PNG, and WebP images are allowed.', ['field' => $field]);
}

function handle_video_upload(string $field, string $subFolder, string $tmpFile, string $originalName): array
{
    // Real video files only, verified from file content — never trust the client's
    // Content-Type or the uploaded filename's extension.
    $allowedMimeToExtension = [
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
    ];

    $mime = null;
    if (function_exists('finfo_open')) {
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = (string) @finfo_file($finfo, $tmpFile);
            @finfo_close($finfo);
        }
    }

    if ($mime === null || !isset($allowedMimeToExtension[$mime])) {
        error_response(400, 'Only MP4, WebM, and OGG videos are allowed.', ['field' => $field]);
    }

    $extension = $allowedMimeToExtension[$mime];
    $base = pathinfo(sanitize_upload_filename($originalName), PATHINFO_FILENAME);
    $filename = resolve_unique_upload_filename($subFolder, $base . '.' . $extension);
    $relative = trim($subFolder, '/') . '/' . $filename;
    $destination = ensure_uploaded_directory($relative);
    if (!move_uploaded_file($tmpFile, $destination)) {
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

// CSV formula-injection guard: a cell value opening with =, +, -, @, or a tab
// is interpreted as a formula by Excel/Sheets when the file is opened. Prefix
// it with a leading apostrophe (standard mitigation) so it's always read back
// as literal text.
function csv_safe_cell(?string $value): string
{
    $value = (string) $value;
    if ($value !== '' && preg_match('/^[=+\-@\t]/', $value) === 1) {
        return "'" . $value;
    }
    return $value;
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

function deep_trim_strings($value)
{
    if (is_string($value)) {
        return trim($value);
    }
    if (is_array($value)) {
        return array_map('deep_trim_strings', $value);
    }
    return $value;
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
            __DIR__ . '/../' . $relative,
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
        'image_alt' => 'imageAlt',
        'image1_alt' => 'image1Alt',
        'detail_image_alt' => 'detailImageAlt',
        'avatar_alt' => 'avatarAlt',
        'icon_alt' => 'iconAlt',
        'cover_alt' => 'coverAlt',
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
    if (file_exists($path)) {
        require_once $path;
        $loaded = true;
        return;
    }

    // Fallback for deployments where scripts/DataInserter.php is missing.
    require_once __DIR__ . '/../config/database.php';
    if (!class_exists('DataInserter', false)) {
        class DataInserter
        {
            public static function insert(string $table, array $data, array $jsonColumns = []): array
            {
                $pdo = Database::connection();
                $allowed = [];
                $params = [];

                foreach ($data as $column => $value) {
                    if ($value === null) {
                        $allowed[$column] = 'NULL';
                        continue;
                    }
                    if (in_array($column, $jsonColumns, true) && is_array($value)) {
                        $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    }
                    $allowed[$column] = ':' . $column;
                    $params[$column] = $value;
                }

                $timestamp = now();
                $params['created_at'] = $timestamp;
                $params['updated_at'] = $timestamp;
                $allowed['created_at'] = ':created_at';
                $allowed['updated_at'] = ':updated_at';

                $sql = sprintf(
                    'INSERT INTO %s (%s) VALUES (%s)',
                    $table,
                    implode(', ', array_keys($allowed)),
                    implode(', ', $allowed)
                );

                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_filter($params, fn($value) => $value !== null, ARRAY_FILTER_USE_BOTH));

                $id = (int) $pdo->lastInsertId();
                $stmt = $pdo->query(sprintf('SELECT * FROM %s WHERE id = %d', $table, $id));
                $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

                foreach ($jsonColumns as $column) {
                    if (isset($row[$column])) {
                        $decoded = json_decode($row[$column], true);
                        $row[$column] = json_last_error() === JSON_ERROR_NONE ? $decoded : $row[$column];
                    }
                }

                return $row;
            }
        }
    }

    $loaded = true;
}

function normalize_model_image_urls(array $data, array $imageFields): array
{
    // CHANGE: Transform image filenames/paths to full URLs for frontend compatibility
    // WHY: Handle various formats: filename, relative path, /uploads/path, uploads/path
    foreach ($imageFields as $field) {
        $value = $data[$field] ?? '';
        if (!$value) continue;
        
        // Already a complete URL path
        if (str_starts_with($value, '/')) {
            $data[$field] = $value;
        } elseif (str_contains($value, 'uploads/')) {
            // Path already contains uploads but missing leading /
            $data[$field] = '/' . $value;
        } else {
            // Just a filename, needs full path
            $data[$field] = '/uploads/' . $value;
        }
    }
    return $data;
}

function delete_uploaded_file_if_present(?string $relativePathOrUrl): void
{
    $raw = trim((string) ($relativePathOrUrl ?? ''));
    if ($raw === '' || preg_match('#^https?://#i', $raw)) {
        return;
    }

    // Normalize into a path relative to backend/ (sibling of backend/public),
    // the same way ensure_uploaded_directory() resolves upload paths.
    $relative = ltrim($raw, '/');
    if ($relative === '') {
        return;
    }
    if (stripos($relative, 'uploads/') !== 0 && strpos($relative, '/') === false) {
        // Bare filename with no directory — assume it lives directly under uploads/.
        $relative = 'uploads/' . $relative;
    }

    $base = realpath(__DIR__ . '/../uploads');
    if ($base === false) {
        return;
    }

    $target = realpath(__DIR__ . '/../' . $relative);
    if ($target === false || !is_file($target)) {
        return;
    }

    // Containment check mirrors resolve_static_candidate() in public/router.php:
    // only unlink files that resolve strictly inside backend/uploads.
    if (strpos($target, $base . DIRECTORY_SEPARATOR) !== 0) {
        return;
    }

    @unlink($target);
}

function table_has_column(string $table, string $column): bool
{
    static $cache = [];
    $key = $table . '.' . $column;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    try {
        $safeTable = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
        if ($safeTable !== '') {
            $stmt = Database::connection()->prepare("SHOW COLUMNS FROM `{$safeTable}` LIKE :column");
            $stmt->execute(['column' => $column]);
            $found = (bool) $stmt->fetch();
            $cache[$key] = $found;
            if ($found) {
                return true;
            }
        }
    } catch (Throwable $e) {
        // Fall through to information_schema check.
    }

    try {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
        );
        $stmt->execute(['table' => $table, 'column' => $column]);
        $cache[$key] = (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        $cache[$key] = false;
    }

    return $cache[$key];
}

/**
 * Allowlist-based HTML sanitizer for stored rich text (currently: blog post
 * content, which renders on the public site via dangerouslySetInnerHTML).
 * No external dependency (this app is intentionally dependency-free) — uses
 * PHP's built-in DOMDocument.
 *
 * Strategy: walk the DOM depth-first, POST-order (children before parent) so
 * that when a disallowed wrapper element is unwrapped or a dangerous element
 * is dropped, its descendants have already been fully sanitized — a
 * <script> nested inside some unknown tag can never survive by riding along
 * when the wrapper is unwrapped.
 */
function sanitize_html(?string $html): string
{
    $html = (string) $html;
    if (trim($html) === '') {
        return '';
    }

    $doc = new DOMDocument('1.0', 'UTF-8');
    libxml_use_internal_errors(true);
    $doc->loadHTML(
        '<?xml encoding="UTF-8"><div id="__sanitize_root__">' . $html . '</div>',
        LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET | LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
    );
    libxml_clear_errors();

    $root = $doc->getElementById('__sanitize_root__');
    if ($root === null) {
        return '';
    }

    sanitize_html_node($root);

    $out = '';
    foreach (iterator_to_array($root->childNodes) as $child) {
        $out .= $doc->saveHTML($child);
    }
    return trim($out);
}

function sanitize_html_node(DOMElement $node): void
{
    static $allowedTags = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
        'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sub', 'sup',
    ];
    // Removed along with their entire contents (unlike an unrecognized tag,
    // which is just unwrapped) — these are either inherently dangerous or
    // never a legitimate part of rich-text body copy.
    static $stripEntirely = [
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
        'textarea', 'select', 'link', 'meta', 'base', 'svg', 'math', 'noscript', 'applet',
    ];
    static $allowedAttributesByTag = [
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'title', 'width', 'height'],
    ];

    foreach (iterator_to_array($node->childNodes) as $child) {
        if ($child instanceof DOMComment || $child instanceof DOMProcessingInstruction) {
            $node->removeChild($child);
            continue;
        }
        if (!($child instanceof DOMElement)) {
            continue; // text node — left as-is (DOMDocument already entity-escapes on save)
        }

        // Post-order: sanitize the subtree before deciding this node's fate.
        sanitize_html_node($child);

        $tag = strtolower($child->tagName);

        if (in_array($tag, $stripEntirely, true)) {
            $node->removeChild($child);
            continue;
        }

        if (!in_array($tag, $allowedTags, true)) {
            while ($child->firstChild) {
                $node->insertBefore($child->firstChild, $child);
            }
            $node->removeChild($child);
            continue;
        }

        $allowedAttributes = array_merge(['class'], $allowedAttributesByTag[$tag] ?? []);
        foreach (iterator_to_array($child->attributes ?? []) as $attr) {
            $attrName = strtolower($attr->name);
            if (str_starts_with($attrName, 'on') || !in_array($attrName, $allowedAttributes, true)) {
                $child->removeAttribute($attr->name);
                continue;
            }
            if (in_array($attrName, ['href', 'src'], true) && !is_safe_url_scheme($attr->value)) {
                $child->removeAttribute($attr->name);
            }
        }
        if ($tag === 'a' && $child->getAttribute('target') === '_blank') {
            $child->setAttribute('rel', 'noopener noreferrer');
        }
    }
}

function is_safe_url_scheme(string $url): bool
{
    $url = trim($url);
    if ($url === '') {
        return true;
    }
    if (!preg_match('#^([a-zA-Z][a-zA-Z0-9+.\-]*):#', $url, $matches)) {
        return true; // no scheme => relative URL, safe
    }
    return in_array(strtolower($matches[1]), ['http', 'https', 'mailto', 'tel'], true);
}
