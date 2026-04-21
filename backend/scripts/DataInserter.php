<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

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
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        foreach ($jsonColumns as $column) {
            if (isset($row[$column])) {
                $decoded = json_decode($row[$column], true);
                $row[$column] = json_last_error() === JSON_ERROR_NONE ? $decoded : $row[$column];
            }
        }

        return $row ?: [];
    }
}
