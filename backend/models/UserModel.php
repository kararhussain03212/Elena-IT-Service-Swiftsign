<?php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../utils/rbac.php';

class UserModel extends BaseModel
{
    protected static string $table = 'users';
    protected static array $jsonColumns = ['permissions', 'activity'];

    public static function findByEmail(string $email, bool $withPassword = false): ?array
    {
        $columns = $withPassword ? '*' : 'id, name, email, designation, phone, location, bio, avatar, role, status, permissions, last_login, activity, created_at, updated_at';
        $sql = sprintf('SELECT %s FROM %s WHERE email = :email LIMIT 1', $columns, static::$table);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['email' => strtolower(trim($email))]);
        $user = $stmt->fetch();
        if (!$user) {
            return null;
        }
        return static::decodeRow($user);
    }

    public static function findByEmailWithPassword(string $email): ?array
    {
        return self::findByEmail($email, true);
    }

    public static function findWithPassword(int $id): ?array
    {
        $sql = sprintf('SELECT * FROM %s WHERE id = :id LIMIT 1', static::$table);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();
        return $user ? static::decodeRow($user) : null;
    }

    public static function list(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = min(max(1, (int) ($filters['limit'] ?? 10)), 100);
        $offset = ($page - 1) * $limit;
        $search = trim((string) ($filters['search'] ?? ''));
        $role = normalize_role_value($filters['role'] ?? '');
        $status = strtolower(trim((string) ($filters['status'] ?? '')));
        $allowedSort = ['name', 'email', 'role', 'status', 'last_login', 'created_at'];
        $sortBy = in_array($filters['sortBy'] ?? '', $allowedSort, true) ? $filters['sortBy'] : 'created_at';
        $sortOrder = strtolower((string) ($filters['sortOrder'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $where = [];
        $params = [];
        if ($search !== '') {
            $where[] = '(name LIKE :search OR email LIKE :search)';
            $params['search'] = "%$search%";
        }
        if (in_array($role, USER_ROLES, true)) {
            $where[] = 'role = :role';
            $params['role'] = $role;
        }
        if (in_array($status, USER_STATUSES, true)) {
            $where[] = 'status = :status';
            $params['status'] = $status;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = sprintf('SELECT * FROM %s %s ORDER BY %s %s LIMIT :offset, :limit', static::$table, $whereClause, $sortBy, $sortOrder);
        $stmt = self::getConnection()->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $countSql = sprintf('SELECT COUNT(*) FROM %s %s', static::$table, $whereClause);
        $countStmt = self::getConnection()->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        return [
            'data' => array_map([static::class, 'decodeRow'], $items),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }
}
