<?php
require_once __DIR__ . '/BaseModel.php';

class ContactMessageModel extends BaseModel
{
    protected static string $table = 'contact_messages';

    public static function paginate(int $page = 1, int $limit = 20, string $search = '', ?bool $read = null): array
    {
        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if ($read !== null) {
            $where[] = 'is_read = :is_read';
            $params['is_read'] = $read ? 1 : 0;
        }

        if ($search !== '') {
            $where[] = '(name LIKE :search OR email LIKE :search OR subject LIKE :search OR message LIKE :search)';
            $params['search'] = "%$search%";
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = sprintf('SELECT * FROM %s %s ORDER BY created_at DESC LIMIT :offset, :limit', static::$table, $whereClause);
        $stmt = self::getConnection()->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $countSql = sprintf('SELECT COUNT(*) FROM %s %s', static::$table, $whereClause);
        $countStmt = self::getConnection()->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        return ['items' => $items, 'total' => $total];
    }
}
