<?php
require_once __DIR__ . '/BaseModel.php';

class SliderModel extends BaseModel
{
    protected static string $table = 'sliders';
    protected static array $imageColumns = ['image', 'video'];

    public static function list(bool $includeInactive = false): array
    {
        $where = '';
        $params = [];
        if (!$includeInactive) {
            $where = '(is_active = 1 OR is_active IS NULL)';
        }
        return self::fetchAll($where, $params, 'CASE WHEN sort_order IS NULL OR sort_order <= 0 THEN 1 ELSE 0 END, sort_order ASC, created_at ASC, id ASC');
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
