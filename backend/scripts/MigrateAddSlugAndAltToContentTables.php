<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (bool) $stmt->fetchColumn();
}

function index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index LIMIT 1'
    );
    $stmt->execute(['table' => $table, 'index' => $index]);
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

function add_index_if_missing(PDO $pdo, string $table, string $index, string $ddl): void
{
    if (index_exists($pdo, $table, $index)) {
        echo "{$table}.{$index} already exists.\n";
        return;
    }
    $pdo->exec("ALTER TABLE {$table} ADD {$ddl}");
    echo "Added {$table}.{$index}\n";
}

function backfill_slug(PDO $pdo, string $table, string $sourceColumn, string $defaultPrefix): void
{
    $stmt = $pdo->query("SELECT id, {$sourceColumn}, slug FROM {$table}");
    $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    $used = [];

    foreach ($rows as $row) {
        $id = (int) ($row['id'] ?? 0);
        if ($id <= 0) {
            continue;
        }
        $existingSlug = slugify((string) ($row['slug'] ?? ''));
        if ($existingSlug !== '') {
            $used[$existingSlug] = true;
        }
    }

    $update = $pdo->prepare("UPDATE {$table} SET slug = :slug WHERE id = :id");

    foreach ($rows as $row) {
        $id = (int) ($row['id'] ?? 0);
        if ($id <= 0) {
            continue;
        }

        $current = slugify((string) ($row['slug'] ?? ''));
        if ($current !== '') {
            continue;
        }

        $base = slugify((string) ($row[$sourceColumn] ?? ''));
        if ($base === '') {
            $base = $defaultPrefix . '-' . $id;
        }

        $candidate = $base;
        $suffix = 2;
        while (isset($used[$candidate])) {
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }

        $update->execute(['slug' => $candidate, 'id' => $id]);
        $used[$candidate] = true;
    }

    echo "Backfilled {$table}.slug\n";
}

$pdo = Database::connection();

add_column_if_missing($pdo, 'sliders', 'slug', "VARCHAR(191) NOT NULL DEFAULT '' AFTER title");
add_column_if_missing($pdo, 'sliders', 'image_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER image");
backfill_slug($pdo, 'sliders', 'title', 'slider');
add_index_if_missing($pdo, 'sliders', 'uq_sliders_slug', 'UNIQUE KEY uq_sliders_slug (slug)');

add_column_if_missing($pdo, 'testimonials', 'slug', "VARCHAR(191) NOT NULL DEFAULT '' AFTER name");
add_column_if_missing($pdo, 'testimonials', 'avatar_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER avatar");
backfill_slug($pdo, 'testimonials', 'name', 'testimonial');
add_index_if_missing($pdo, 'testimonials', 'uq_testimonials_slug', 'UNIQUE KEY uq_testimonials_slug (slug)');

add_column_if_missing($pdo, 'sub_services', 'slug', "VARCHAR(191) NOT NULL DEFAULT '' AFTER title");
add_column_if_missing($pdo, 'sub_services', 'icon_alt', "VARCHAR(255) NOT NULL DEFAULT '' AFTER icon");
backfill_slug($pdo, 'sub_services', 'title', 'sub-service');
add_index_if_missing($pdo, 'sub_services', 'uq_sub_services_slug', 'UNIQUE KEY uq_sub_services_slug (slug)');

echo "Migration completed.\n";
