<?php
require_once __DIR__ . '/../config/database.php';

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (bool) $stmt->fetchColumn();
}

$pdo = Database::connection();

$table = 'services';
$changes = 0;

if (!column_exists($pdo, $table, 'benefits')) {
    $pdo->exec(sprintf('ALTER TABLE %s ADD COLUMN benefits LONGTEXT NULL', $table));
    $changes++;
}

if (!column_exists($pdo, $table, 'faqs')) {
    $pdo->exec(sprintf('ALTER TABLE %s ADD COLUMN faqs LONGTEXT NULL', $table));
    $changes++;
}

echo $changes ? "Migration complete.\n" : "Nothing to migrate.\n";
