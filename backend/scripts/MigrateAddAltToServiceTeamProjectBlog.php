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

function add_column_if_missing(PDO $pdo, string $table, string $column, string $definition): void
{
    if (column_exists($pdo, $table, $column)) {
        echo "{$table}.{$column} already exists.\n";
        return;
    }
    $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    echo "Added {$table}.{$column}\n";
}

$pdo = Database::connection();

add_column_if_missing($pdo, 'services', 'image_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER image");
add_column_if_missing($pdo, 'services', 'image1_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER image1");
add_column_if_missing($pdo, 'services', 'detail_image_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER detail_image");
add_column_if_missing($pdo, 'team_members', 'image_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER image");
add_column_if_missing($pdo, 'projects', 'cover_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER cover_image");
add_column_if_missing($pdo, 'blogs', 'cover_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER cover_image");

$pdo->exec("UPDATE services SET image_alt = title WHERE image_alt = ''");
$pdo->exec("UPDATE services SET detail_image_alt = title WHERE detail_image_alt = ''");
$pdo->exec("UPDATE team_members SET image_alt = name WHERE image_alt = ''");
$pdo->exec("UPDATE projects SET cover_alt = title WHERE cover_alt = ''");
$pdo->exec("UPDATE blogs SET cover_alt = title WHERE cover_alt = ''");

echo "Migration completed.\n";
