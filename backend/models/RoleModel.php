<?php
require_once __DIR__ . '/BaseModel.php';

class RoleModel extends BaseModel
{
    protected static string $table = 'roles';
    protected static array $jsonColumns = ['permissions'];

    public static function findByName(string $name): ?array
    {
        $sql = sprintf('SELECT * FROM %s WHERE name = :name LIMIT 1', static::$table);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['name' => strtolower(trim($name))]);
        $row = $stmt->fetch();
        return $row ? static::decodeRow($row) : null;
    }

    public static function list(): array
    {
        return self::fetchAll('', [], 'name ASC');
    }
}
