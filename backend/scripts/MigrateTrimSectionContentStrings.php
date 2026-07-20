<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

try {
    $pdo = Database::connection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $rows = $pdo->query('SELECT id, content FROM section_contents')->fetchAll(PDO::FETCH_ASSOC);
    $updated = 0;

    $stmt = $pdo->prepare('UPDATE section_contents SET content = :content WHERE id = :id');

    foreach ($rows as $row) {
        $decoded = json_decode($row['content'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            continue;
        }
        $trimmed = deep_trim_strings($decoded);
        $encoded = json_encode($trimmed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded !== $row['content']) {
            $stmt->execute(['content' => $encoded, 'id' => $row['id']]);
            $updated++;
        }
    }

    echo "Trimmed whitespace in {$updated} of " . count($rows) . " section_contents rows.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
