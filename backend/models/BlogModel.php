<?php
require_once __DIR__ . '/BaseModel.php';

class BlogModel extends BaseModel
{
    protected static string $table = 'blogs';
    protected static array $jsonColumns = ['tags'];

    public static function list(bool $includeUnpublished = false): array
    {
        $where = '';
        if (!$includeUnpublished) {
            $where = 'published = 1';
        }
        return self::fetchAll($where, [], 'created_at DESC');
    }

    public static function findBySlug(string $slug, bool $includeUnpublished = false): ?array
    {
        $where = 'slug = :slug';
        $params = ['slug' => $slug];
        if (!$includeUnpublished) {
            $where .= ' AND published = 1';
        }
        $sql = sprintf('SELECT * FROM %s WHERE %s LIMIT 1', static::$table, $where);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ? static::decodeRow($row) : null;
    }

    public static function togglePublished(int $id): ?array
    {
        $current = self::findById($id);
        if (!$current) {
            return null;
        }
        $next = (int) !((bool) $current['published']);
        return self::update($id, ['published' => $next]);
    }
}
