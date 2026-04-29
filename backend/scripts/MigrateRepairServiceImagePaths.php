<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

$pdo = Database::connection();

$projectRoot = dirname(__DIR__, 2);
$uploadsDir = $projectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
$legacyDirs = [
    $projectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'uploads',
    $projectRoot . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'service',
    $projectRoot . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads',
];

if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

function normalize_upload_value(?string $value): string
{
    $raw = trim((string) $value);
    if ($raw === '' || preg_match('#^https?://#i', $raw)) {
        return $raw;
    }
    if (preg_match('#^/uploads/#i', $raw)) {
        return ltrim($raw, '/');
    }
    if (preg_match('#^uploads/#i', $raw)) {
        return $raw;
    }
    return 'uploads/' . ltrim($raw, '/');
}

function file_exists_in_uploads(string $uploadsDir, string $value): bool
{
    $normalized = normalize_upload_value($value);
    if ($normalized === '' || preg_match('#^https?://#i', $normalized)) {
        return false;
    }
    $name = basename($normalized);
    return file_exists($uploadsDir . DIRECTORY_SEPARATOR . $name);
}

function copy_legacy_to_uploads(string $uploadsDir, array $legacyDirs, string $value): ?string
{
    $normalized = normalize_upload_value($value);
    if ($normalized === '' || preg_match('#^https?://#i', $normalized)) {
        return null;
    }

    $name = basename($normalized);
    $target = $uploadsDir . DIRECTORY_SEPARATOR . $name;
    if (file_exists($target)) {
        return 'uploads/' . $name;
    }

    foreach ($legacyDirs as $dir) {
        $candidate = $dir . DIRECTORY_SEPARATOR . $name;
        if (file_exists($candidate) && is_file($candidate)) {
            if (@copy($candidate, $target)) {
                return 'uploads/' . $name;
            }
        }
    }

    return null;
}

$rows = $pdo->query('SELECT id, image, image1, detail_image FROM services ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
$update = $pdo->prepare('UPDATE services SET image = :image, image1 = :image1, detail_image = :detail_image, updated_at = :updated_at WHERE id = :id');

$updated = 0;
$copied = 0;
foreach ($rows as $row) {
    $next = [
        'image' => (string) ($row['image'] ?? ''),
        'image1' => (string) ($row['image1'] ?? ''),
        'detail_image' => (string) ($row['detail_image'] ?? ''),
    ];

    foreach (['image', 'image1', 'detail_image'] as $field) {
        $current = trim($next[$field]);
        if ($current === '' || preg_match('#^https?://#i', $current)) {
            continue;
        }

        $normalized = normalize_upload_value($current);
        $name = basename($normalized);
        if (file_exists($uploadsDir . DIRECTORY_SEPARATOR . $name)) {
            $next[$field] = 'uploads/' . $name;
            continue;
        }

        $copiedPath = copy_legacy_to_uploads($uploadsDir, $legacyDirs, $current);
        if ($copiedPath !== null) {
            $next[$field] = $copiedPath;
            $copied++;
        }
    }

    if (
        $next['image'] !== (string) ($row['image'] ?? '') ||
        $next['image1'] !== (string) ($row['image1'] ?? '') ||
        $next['detail_image'] !== (string) ($row['detail_image'] ?? '')
    ) {
        $update->execute([
            'id' => (int) $row['id'],
            'image' => $next['image'],
            'image1' => $next['image1'],
            'detail_image' => $next['detail_image'],
            'updated_at' => (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s'),
        ]);
        $updated++;
    }
}

echo 'Done. Services updated: ' . $updated . PHP_EOL;
echo 'Files copied to backend/public/uploads: ' . $copied . PHP_EOL;
