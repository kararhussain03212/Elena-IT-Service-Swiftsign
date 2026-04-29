<?php
require_once __DIR__ . '/BaseModel.php';

class SubServiceModel extends BaseModel
{
    protected static string $table = 'sub_services';
    protected static array $imageColumns = ['icon'];

    public static function list(bool $includeInactive = false): array
    {
        $where = '';
        if (!$includeInactive) {
            $where = '(is_active = 1 OR is_active IS NULL)';
        }
        return self::fetchAll($where, [], 'CASE WHEN sort_order IS NULL OR sort_order <= 0 THEN 1 ELSE 0 END, sort_order ASC, created_at ASC, id ASC');
    }

    public static function toggleActive(int $id): ?array
    {
        $current = self::findById($id);
        if (!$current) {
            return null;
        }
        $next = (int) !((bool) $current['is_active']);
        return self::update($id, ['is_active' => $next]);
    }
}
