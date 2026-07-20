<?php
require_once __DIR__ . '/BaseModel.php';

class CareerPageContentModel extends BaseModel
{
    protected static string $table = 'career_page_content';

    public static function get(): ?array
    {
        return self::findById(1);
    }

    public static function save(array $data): array
    {
        $existing = self::get();
        if (!$existing) {
            $data['id'] = 1;
            $data['created_at'] = now();
            $data['updated_at'] = now();
            $columns = array_keys($data);
            $placeholders = array_map(fn($col) => ':' . $col, $columns);
            $sql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s)',
                static::$table,
                implode(', ', $columns),
                implode(', ', $placeholders)
            );
            $stmt = self::getConnection()->prepare($sql);
            $stmt->execute($data);
            return self::get();
        }

        return self::update(1, $data);
    }
}
