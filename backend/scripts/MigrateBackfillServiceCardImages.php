<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

$pdo = Database::connection();

$select = $pdo->query('SELECT id, image, image1, detail_image, icon FROM services');
$rows = $select ? ($select->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];

$looksLikeImage = function (?string $value): bool {
    $raw = trim((string) $value);
    if ($raw === '') {
        return false;
    }
    if (preg_match('#^https?://#i', $raw)) {
        return true;
    }
    if (preg_match('#^/?uploads/#i', $raw)) {
        return true;
    }
    return preg_match('/\.(png|jpe?g|webp|gif|svg)$/i', $raw) === 1;
};

$normalize = function (?string $value): string {
    $raw = trim((string) $value);
    if ($raw === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $raw)) {
        return $raw;
    }
    if (preg_match('#^/uploads/#i', $raw)) {
        return ltrim($raw, '/');
    }
    if (preg_match('#^uploads/#i', $raw)) {
        return $raw;
    }
    return 'uploads/' . ltrim($raw, '/');
};

$update = $pdo->prepare('UPDATE services SET image = :image, updated_at = :updated_at WHERE id = :id');
$updatedCount = 0;

foreach ($rows as $row) {
    $current = trim((string) ($row['image'] ?? ''));
    if ($current !== '' && $looksLikeImage($current)) {
        continue;
    }

    $candidates = [
        $row['image1'] ?? '',
        $row['detail_image'] ?? '',
        $row['icon'] ?? '',
    ];

    $selected = '';
    foreach ($candidates as $candidate) {
        if ($looksLikeImage($candidate)) {
            $selected = $normalize($candidate);
            break;
        }
    }

    if ($selected === '') {
        continue;
    }

    $update->execute([
        'id' => (int) $row['id'],
        'image' => $selected,
        'updated_at' => (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s'),
    ]);
    $updatedCount++;
}

echo "Done. Updated services: {$updatedCount}" . PHP_EOL;
