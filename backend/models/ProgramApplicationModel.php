<?php
require_once __DIR__ . '/BaseModel.php';

class ProgramApplicationModel extends BaseModel
{
    protected static string $table = 'program_applications';

    public static function paginate(int $page = 1, int $limit = 20, ?int $programId = null, string $status = ''): array
    {
        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if ($programId !== null) {
            $where[] = 'program_id = :program_id';
            $params['program_id'] = $programId;
        }
        if ($status !== '') {
            $where[] = 'status = :status';
            $params['status'] = $status;
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
        $items = array_map([static::class, 'decodeRow'], $stmt->fetchAll());

        $countSql = sprintf('SELECT COUNT(*) FROM %s %s', static::$table, $whereClause);
        $countStmt = self::getConnection()->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        return ['items' => $items, 'total' => $total];
    }
}
