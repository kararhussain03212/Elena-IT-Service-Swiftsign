<?php
require_once __DIR__ . '/../config/database.php';

function ensure_rate_limits_table(): void
{
    Database::connection()->exec(
        'CREATE TABLE IF NOT EXISTS rate_limits (
            bucket_key VARCHAR(191) NOT NULL PRIMARY KEY,
            attempts INT UNSIGNED NOT NULL DEFAULT 1,
            window_start DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

/**
 * Atomically records one attempt against $key and reports whether it's still
 * within the allowed rate. A sliding window isn't needed here — a fixed
 * window that resets once $windowSeconds has elapsed since the first attempt
 * in the bucket is enough to blunt brute-force/mass-registration attempts
 * without adding a queueing/Redis dependency to an otherwise dependency-free
 * app. Every call counts as one attempt (success or failure) so a client
 * that stops guessing also stops consuming the budget.
 */
function check_rate_limit(string $key, int $maxAttempts, int $windowSeconds): bool
{
    $pdo = Database::connection();
    $sql = 'INSERT INTO rate_limits (bucket_key, attempts, window_start, updated_at)
            VALUES (:key, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                attempts = IF(window_start < DATE_SUB(NOW(), INTERVAL :window1 SECOND), 1, attempts + 1),
                window_start = IF(window_start < DATE_SUB(NOW(), INTERVAL :window2 SECOND), NOW(), window_start),
                updated_at = NOW()';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['key' => $key, 'window1' => $windowSeconds, 'window2' => $windowSeconds]);
    } catch (PDOException) {
        // Fresh install / table not migrated yet — create it once and retry.
        ensure_rate_limits_table();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['key' => $key, 'window1' => $windowSeconds, 'window2' => $windowSeconds]);
    }

    $check = $pdo->prepare('SELECT attempts FROM rate_limits WHERE bucket_key = :key');
    $check->execute(['key' => $key]);
    $attempts = (int) $check->fetchColumn();

    // No cron in this app — opportunistically sweep stale buckets so the
    // table doesn't grow forever. Cheap and rare enough not to matter.
    if (random_int(1, 200) === 1) {
        $pdo->exec("DELETE FROM rate_limits WHERE updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)");
    }

    return $attempts <= $maxAttempts;
}

function client_ip(): string
{
    return (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown');
}
