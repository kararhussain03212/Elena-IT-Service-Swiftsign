<?php
require_once __DIR__ . '/BaseModel.php';

class SectionContentModel extends BaseModel
{
    protected static string $table = 'section_contents';
    protected static array $jsonColumns = ['content'];
    protected static array $imageColumns = ['image'];

    public static function list(string $page = '', bool $includeInactive = false): array
    {
        $where = '';
        $params = [];
        if ($page !== '') {
            $where = 'page = :page';
            $params['page'] = $page;
        }
        if (!$includeInactive) {
            $where = $where === '' ? '(is_active = 1 OR is_active IS NULL)' : "$where AND (is_active = 1 OR is_active IS NULL)";
        }
        return self::fetchAll($where, $params, 'CASE WHEN sort_order IS NULL OR sort_order <= 0 THEN 1 ELSE 0 END, sort_order ASC, created_at ASC, id ASC');
    }

    public static function findByKey(string $key, bool $includeInactive = false): ?array
    {
        $where = 'key_name = :key';
        $params = ['key' => $key];
        if (!$includeInactive) {
            $where .= ' AND (is_active = 1 OR is_active IS NULL)';
        }
        $sql = sprintf('SELECT * FROM %s WHERE %s LIMIT 1', static::$table, $where);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ? static::decodeRow($row) : null;
    }
}
