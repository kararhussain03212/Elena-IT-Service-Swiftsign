<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

function table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
    );
    $stmt->execute(['table' => $table]);
    return (bool) $stmt->fetchColumn();
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
    );
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (bool) $stmt->fetchColumn();
}

function normalize_social_links($rawLinks): array
{
    $links = ensure_array($rawLinks);
    if (!is_array($links) || empty($links)) {
        return [];
    }

    $normalized = [];

    if (is_assoc_array($links)) {
        foreach ($links as $platform => $url) {
            $name = sanitize_string($platform);
            $href = sanitize_string($url);
            if ($name === '' || $href === '' || $href === '#') {
                continue;
            }
            $normalized[$name] = $href;
        }

        return $normalized;
    }

    foreach ($links as $item) {
        if (!is_array($item)) {
            continue;
        }

        $name = sanitize_string($item['name'] ?? $item['platform'] ?? $item['key'] ?? '');
        $href = sanitize_string($item['href'] ?? $item['url'] ?? $item['link'] ?? '');

        if ($name === '' || $href === '' || $href === '#') {
            continue;
        }

        $normalized[$name] = $href;
    }

    return $normalized;
}

$pdo = Database::connection();
$tableCreated = false;

if (!table_exists($pdo, 'team_social_links')) {
    $pdo->exec(
        <<<SQL
CREATE TABLE team_social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_member_id INT NOT NULL,
  platform_name VARCHAR(120) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_team_social_links_member (team_member_id),
  UNIQUE KEY uq_team_social_links_member_platform (team_member_id, platform_name),
  CONSTRAINT fk_team_social_links_member
    FOREIGN KEY (team_member_id) REFERENCES team_members(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );
    $tableCreated = true;
}

$migratedMembers = 0;
$migratedLinks = 0;

if (column_exists($pdo, 'team_members', 'social_links')) {
    $membersStmt = $pdo->query('SELECT id, social_links FROM team_members');

    $upsertStmt = $pdo->prepare(
        'INSERT INTO team_social_links (team_member_id, platform_name, url, sort_order, created_at, updated_at)
         VALUES (:team_member_id, :platform_name, :url, :sort_order, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE
            url = VALUES(url),
            sort_order = VALUES(sort_order),
            updated_at = VALUES(updated_at)'
    );

    foreach (($membersStmt->fetchAll() ?: []) as $member) {
        $memberId = (int) ($member['id'] ?? 0);
        if ($memberId <= 0) {
            continue;
        }

        $socialLinks = normalize_social_links($member['social_links'] ?? []);
        if (empty($socialLinks)) {
            continue;
        }

        $timestamp = now();
        $order = 1;
        foreach ($socialLinks as $platform => $url) {
            $upsertStmt->execute([
                'team_member_id' => $memberId,
                'platform_name' => $platform,
                'url' => $url,
                'sort_order' => $order++,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
            $migratedLinks++;
        }

        $migratedMembers++;
    }
}

echo $tableCreated ? "team_social_links table created.\n" : "team_social_links table already exists.\n";
echo "Backfilled team members: {$migratedMembers}\n";
echo "Backfilled social links: {$migratedLinks}\n";
