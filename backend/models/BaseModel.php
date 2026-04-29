<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

abstract class BaseModel
{
    protected static string $table = '';
    protected static array $jsonColumns = [];
    protected static array $imageColumns = [];

    protected static function getConnection(): PDO
    {
        return Database::connection();
    }

    protected static function decodeRow(array $row): array
    {
        foreach (static::$jsonColumns as $column) {
            if (array_key_exists($column, $row) && $row[$column] !== null) {
                $decoded = json_decode($row[$column], true);
                $row[$column] = json_last_error() === JSON_ERROR_NONE ? $decoded : $row[$column];
            }
        }
        return static::normalizeImages($row);
    }

    protected static function normalizeImages(array $row): array
    {
        // CHANGE: Normalize image URLs for all models
        if (!empty(static::$imageColumns)) {
            $row = normalize_model_image_urls($row, static::$imageColumns);
        }
        return $row;
    }

    public static function findById($id): ?array
    {
        $sql = sprintf('SELECT * FROM %s WHERE id = :id', static::$table);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? static::decodeRow($row) : null;
    }

    public static function fetchAll(string $where = '', array $params = [], string $order = 'id DESC'): array
    {
        $sql = sprintf('SELECT * FROM %s %s ORDER BY %s', static::$table, $where ? "WHERE $where" : '', $order);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return array_map([static::class, 'decodeRow'], $rows);
    }

    public static function update(int $id, array $data): ?array
    {
        if (empty($data)) {
            return static::findById($id);
        }
        $data['updated_at'] = now();
        $set = [];
        $params = [];
        foreach ($data as $column => $value) {
            $set[] = sprintf('%s = :%s', $column, $column);
            $params[$column] = static::prepareValue($column, $value);
        }
        $params['id'] = $id;
        $sql = sprintf('UPDATE %s SET %s WHERE id = :id', static::$table, implode(', ', $set));
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return static::findById($id);
    }

    public static function delete(int $id): void
    {
        $sql = sprintf('DELETE FROM %s WHERE id = :id', static::$table);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['id' => $id]);
    }

    protected static function prepareValue(string $column, $value)
    {
        if (in_array($column, static::$jsonColumns, true)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        return $value;
    }
}
