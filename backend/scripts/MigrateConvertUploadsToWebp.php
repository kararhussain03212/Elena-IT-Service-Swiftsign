<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

$args = $_SERVER['argv'] ?? [];
$isDryRun = in_array('--dry-run', $args, true) || in_array('-n', $args, true);

function detect_image_type_for_conversion(string $path): ?string
{
    if (function_exists('exif_imagetype')) {
        $type = @exif_imagetype($path);
        if ($type === IMAGETYPE_JPEG) {
            return 'jpeg';
        }
        if ($type === IMAGETYPE_PNG) {
            return 'png';
        }
    }

    $imageInfo = @getimagesize($path);
    $mime = strtolower((string) ($imageInfo['mime'] ?? ''));
    if ($mime === 'image/jpeg') {
        return 'jpeg';
    }
    if ($mime === 'image/png') {
        return 'png';
    }

    if (function_exists('finfo_open')) {
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = strtolower((string) @finfo_file($finfo, $path));
            @finfo_close($finfo);
            if ($mime === 'image/jpeg') {
                return 'jpeg';
            }
            if ($mime === 'image/png') {
                return 'png';
            }
        }
    }
    return null;
}

function convert_file_to_webp(string $source, string $destination, string $sourceType, int $quality): bool
{
    $quality = max(1, min(100, $quality));

    if (class_exists('Imagick')) {
        try {
            $imagick = new Imagick();
            $imagick->readImage($source);
            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality($quality);
            $ok = $imagick->writeImage($destination);
            $imagick->clear();
            $imagick->destroy();
            if ($ok && file_exists($destination) && filesize($destination) > 0) {
                return true;
            }
        } catch (Throwable $e) {
            // Fall back to GD.
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

    $ok = @imagewebp($image, $destination, $quality);
    imagedestroy($image);
    return $ok && file_exists($destination) && filesize($destination) > 0;
}

function iter_image_files(array $directories): array
{
    $files = [];
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            continue;
        }
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $fileInfo) {
            if (!$fileInfo->isFile()) {
                continue;
            }
            $path = $fileInfo->getPathname();
            if (!preg_match('/\.(jpe?g|png)$/i', $path)) {
                continue;
            }
            $files[] = $path;
        }
    }
    return $files;
}

$quality = 80;
$projectRoot = dirname(__DIR__, 2);
$uploadDirectories = [
    $projectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'uploads',
    $projectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads',
];

$sourceFiles = iter_image_files($uploadDirectories);
$basenameMap = [];
$converted = 0;
$failed = 0;
$alreadyPresent = 0;
$plannedConversions = 0;
$plannedDbUpdates = 0;
$plannedRepairs = 0;
$writeSkipped = 0;

foreach ($sourceFiles as $source) {
    $type = detect_image_type_for_conversion($source);
    if (!in_array($type, ['jpeg', 'png'], true)) {
        continue;
    }

    $target = preg_replace('/\.(jpe?g|png)$/i', '.webp', $source);
    if ($target === null || $target === '') {
        continue;
    }

    if (file_exists($target) && filesize($target) > 0) {
        $basenameMap[basename($source)] = basename($target);
        $alreadyPresent++;
        continue;
    }

    $plannedConversions++;
    if ($isDryRun) {
        $basenameMap[basename($source)] = basename($target);
        $writeSkipped++;
        continue;
    }

    if (convert_file_to_webp($source, $target, $type, $quality)) {
        $basenameMap[basename($source)] = basename($target);
        $converted++;
    } else {
        $failed++;
    }
}

$pdo = Database::connection();
$stringTypes = "'char','varchar','tinytext','text','mediumtext','longtext'";
$columnsStmt = $pdo->query(
    "SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND data_type IN ($stringTypes)
       AND column_name REGEXP 'image|avatar|icon|logo|thumbnail|photo|banner|cover'"
);
$columns = $columnsStmt ? ($columnsStmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];

$updatedRows = 0;
$updatedFields = 0;

foreach ($columns as $columnMeta) {
    $table = (string) ($columnMeta['table_name'] ?? '');
    $column = (string) ($columnMeta['column_name'] ?? '');
    if ($table === '' || $column === '') {
        continue;
    }

    $hasIdStmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $hasIdStmt->execute(['table' => $table, 'column' => 'id']);
    if (!(bool) $hasIdStmt->fetchColumn()) {
        continue;
    }

    $hasUpdatedAtStmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $hasUpdatedAtStmt->execute(['table' => $table, 'column' => 'updated_at']);
    $hasUpdatedAt = (bool) $hasUpdatedAtStmt->fetchColumn();

    $safeTable = str_replace('`', '``', $table);
    $safeColumn = str_replace('`', '``', $column);
    $selectSql = sprintf('SELECT id, `%s` AS value FROM `%s`', $safeColumn, $safeTable);
    $rows = $pdo->query($selectSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $updateSql = $hasUpdatedAt
        ? sprintf('UPDATE `%s` SET `%s` = :value, updated_at = :updated_at WHERE id = :id', $safeTable, $safeColumn)
        : sprintf('UPDATE `%s` SET `%s` = :value WHERE id = :id', $safeTable, $safeColumn);
    $updateStmt = $pdo->prepare($updateSql);

    foreach ($rows as $row) {
        $value = trim((string) ($row['value'] ?? ''));
        if ($value === '' || preg_match('#^https?://#i', $value)) {
            continue;
        }
        if (!preg_match('/\.(jpe?g|png)(\?.*)?$/i', $value)) {
            continue;
        }

        $parsedPath = parse_url($value, PHP_URL_PATH);
        $pathForMatch = is_string($parsedPath) ? $parsedPath : $value;
        $baseName = basename($pathForMatch);
        if (!isset($basenameMap[$baseName])) {
            continue;
        }

        $newBaseName = $basenameMap[$baseName];
        $nextValue = preg_replace('/' . preg_quote($baseName, '/') . '(?=(\?.*)?$)/', $newBaseName, $value, 1);
        if (!is_string($nextValue) || $nextValue === $value) {
            continue;
        }

        $plannedDbUpdates++;
        if ($isDryRun) {
            continue;
        }

        $params = [
            'id' => (int) $row['id'],
            'value' => $nextValue,
        ];
        if ($hasUpdatedAt) {
            $params['updated_at'] = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        }
        $updateStmt->execute($params);

        $updatedRows++;
        $updatedFields++;
    }
}

// Repair pass: if DB points to .webp but file doesn't exist, restore to existing original extension.
$repairedFields = 0;
foreach ($columns as $columnMeta) {
    $table = (string) ($columnMeta['table_name'] ?? '');
    $column = (string) ($columnMeta['column_name'] ?? '');
    if ($table === '' || $column === '') {
        continue;
    }

    $hasIdStmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $hasIdStmt->execute(['table' => $table, 'column' => 'id']);
    if (!(bool) $hasIdStmt->fetchColumn()) {
        continue;
    }

    $hasUpdatedAtStmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $hasUpdatedAtStmt->execute(['table' => $table, 'column' => 'updated_at']);
    $hasUpdatedAt = (bool) $hasUpdatedAtStmt->fetchColumn();

    $safeTable = str_replace('`', '``', $table);
    $safeColumn = str_replace('`', '``', $column);
    $selectSql = sprintf('SELECT id, `%s` AS value FROM `%s`', $safeColumn, $safeTable);
    $rows = $pdo->query($selectSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $updateSql = $hasUpdatedAt
        ? sprintf('UPDATE `%s` SET `%s` = :value, updated_at = :updated_at WHERE id = :id', $safeTable, $safeColumn)
        : sprintf('UPDATE `%s` SET `%s` = :value WHERE id = :id', $safeTable, $safeColumn);
    $updateStmt = $pdo->prepare($updateSql);

    foreach ($rows as $row) {
        $value = trim((string) ($row['value'] ?? ''));
        if ($value === '' || !preg_match('/\.webp(\?.*)?$/i', $value)) {
            continue;
        }

        $parsedPath = parse_url($value, PHP_URL_PATH);
        $pathForMatch = is_string($parsedPath) ? $parsedPath : $value;
        $webpBase = basename($pathForMatch);

        $existingOriginal = null;
        $baseNoExt = preg_replace('/\.webp$/i', '', $webpBase);
        foreach (['jpg', 'jpeg', 'png'] as $ext) {
            $candidateBase = $baseNoExt . '.' . $ext;
            foreach ($uploadDirectories as $dir) {
                if (file_exists($dir . DIRECTORY_SEPARATOR . $candidateBase)) {
                    $existingOriginal = $candidateBase;
                    break 2;
                }
            }
        }

        if ($existingOriginal === null) {
            continue;
        }

        $webpExists = false;
        foreach ($uploadDirectories as $dir) {
            if (file_exists($dir . DIRECTORY_SEPARATOR . $webpBase)) {
                $webpExists = true;
                break;
            }
        }
        if ($webpExists) {
            continue;
        }

        $nextValue = preg_replace('/' . preg_quote($webpBase, '/') . '(?=(\?.*)?$)/', $existingOriginal, $value, 1);
        if (!is_string($nextValue) || $nextValue === $value) {
            continue;
        }

        $plannedRepairs++;
        if ($isDryRun) {
            continue;
        }

        $params = [
            'id' => (int) $row['id'],
            'value' => $nextValue,
        ];
        if ($hasUpdatedAt) {
            $params['updated_at'] = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        }
        $updateStmt->execute($params);
        $repairedFields++;
    }
}

echo 'WebP conversion completed.' . PHP_EOL;
echo 'Mode: ' . ($isDryRun ? 'DRY RUN (no writes)' : 'LIVE (writes enabled)') . PHP_EOL;
echo 'Found JPG/JPEG/PNG files: ' . count($sourceFiles) . PHP_EOL;
echo 'Planned conversions: ' . $plannedConversions . PHP_EOL;
echo 'Converted to WebP: ' . $converted . PHP_EOL;
echo 'Already had WebP: ' . $alreadyPresent . PHP_EOL;
echo 'Failed conversions: ' . $failed . PHP_EOL;
echo 'Planned DB updates: ' . $plannedDbUpdates . PHP_EOL;
echo 'Database values updated: ' . $updatedFields . PHP_EOL;
echo 'Planned DB repairs: ' . $plannedRepairs . PHP_EOL;
echo 'Database values repaired: ' . $repairedFields . PHP_EOL;
if ($isDryRun) {
    echo 'Write operations skipped: ' . $writeSkipped . PHP_EOL;
}
