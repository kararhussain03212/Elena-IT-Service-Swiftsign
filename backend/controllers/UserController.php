<?php
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../scripts/DataInserter.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/rbac.php';

class UserController
{
    private static function normalize_avatar($value): string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '') {
            return '';
        }
        if (preg_match('#^https?://#i', $raw)) {
            return $raw;
        }
        return ltrim(preg_replace('#^/?uploads/#i', '', $raw), '/');
    }

    private static function sanitizeUserRecord(array $user): array
    {
        unset($user['password']);
        $user['permissions'] = normalize_permissions_list($user['permissions'] ?? []);
        $user['role'] = normalize_role_value($user['role'] ?? 'viewer');
        return $user;
    }

    public static function list(array $context): array
    {
        $filters = [
            'page' => parse_integer($context['query']['page'] ?? 1, 1),
            'limit' => parse_integer($context['query']['limit'] ?? 10, 10),
            'search' => $context['query']['search'] ?? '',
            'role' => $context['query']['role'] ?? '',
            'status' => $context['query']['status'] ?? '',
            'sortBy' => $context['query']['sortBy'] ?? 'created_at',
            'sortOrder' => $context['query']['sortOrder'] ?? 'desc',
        ];
        $result = UserModel::list($filters);
        $post = array_map([self::class, 'sanitizeUserRecord'], $result['data']);
        return [
            'data' => $post,
            'pagination' => [
                'page' => $result['page'],
                'limit' => $result['limit'],
                'total' => $result['total'],
                'totalPages' => max(1, (int) ceil($result['total'] / max(1, $result['limit']))),
            ],
        ];
    }

    public static function create(array $context): array
    {
        $body = $context['body'] ?? [];
        $name = sanitize_string($body['name'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        $role = normalize_role_value($body['role'] ?? 'viewer');
        $status = strtolower(trim($body['status'] ?? 'pending'));
        $permissions = normalize_permissions_list($body['permissions'] ?? []);

        if ($name === '' || $email === '' || $password === '') {
            error_response(400, 'Name, email and password are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response(400, 'A valid email is required.');
        }
        if (strlen($password) < 8) {
            error_response(400, 'Password must be at least 8 characters.');
        }
        if (!in_array($role, USER_ROLES, true)) {
            error_response(400, 'Role must be admin, editor, or viewer.');
        }
        if (!in_array($status, USER_STATUSES, true)) {
            error_response(400, 'Status must be active, suspended, or pending.');
        }
        if (!empty($permissions) && array_diff($permissions, PERMISSIONS)) {
            error_response(400, 'Permissions must be valid.');
        }
        $existing = UserModel::findByEmail($email);
        if ($existing) {
            error_response(409, 'Email already in use.');
        }
        $roleDoc = RoleModel::findByName($role) ?? ['permissions' => DEFAULT_ROLE_PERMISSIONS[$role] ?? []];
        $payload = [
            'name' => $name,
            'email' => $email,
            'password' => UserModel::hashPassword($password),
            'role' => $role,
            'status' => $status,
            'designation' => sanitize_string($body['designation'] ?? ''),
            'phone' => sanitize_string($body['phone'] ?? ''),
            'location' => sanitize_string($body['location'] ?? ''),
            'bio' => sanitize_string($body['bio'] ?? ''),
            'avatar' => '',
            'permissions' => $permissions ?: ($roleDoc['permissions'] ?? DEFAULT_ROLE_PERMISSIONS[$role] ?? []),
            'activity' => [
                ['action' => 'user_created', 'description' => 'Account was created by admin.', 'at' => now()],
            ],
        ];
        $created = DataInserter::insert('users', $payload, ['permissions', 'activity']);
        return ['status' => 201, 'data' => self::sanitizeUserRecord($created)];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = UserModel::findById($id);
        if (!$existing) {
            error_response(404, 'User not found.');
        }
        $body = $context['body'] ?? [];
        $updates = [];
        if (isset($body['name'])) {
            $value = sanitize_string($body['name']);
            if ($value === '') {
                error_response(400, 'Full name is required.');
            }
            $updates['name'] = $value;
        }
        if (isset($body['email'])) {
            $value = strtolower(trim($body['email']));
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                error_response(400, 'A valid email is required.');
            }
            $check = UserModel::findByEmail($value);
            if ($check && (int) $check['id'] !== $id) {
                error_response(409, 'Email already exists.');
            }
            $updates['email'] = $value;
        }
        if (isset($body['role'])) {
            $value = normalize_role_value($body['role']);
            if (!in_array($value, USER_ROLES, true)) {
                error_response(400, 'Invalid role.');
            }
            $updates['role'] = $value;
        }
        if (isset($body['status'])) {
            $value = strtolower(trim($body['status']));
            if (!in_array($value, USER_STATUSES, true)) {
                error_response(400, 'Invalid status.');
            }
            $updates['status'] = $value;
        }
        if (isset($body['permissions'])) {
            $value = normalize_permissions_list($body['permissions']);
            if (array_diff($value, PERMISSIONS)) {
                error_response(400, 'Invalid permissions.');
            }
            $updates['permissions'] = $value;
        }
        if (isset($body['designation'])) {
            $updates['designation'] = sanitize_string($body['designation']);
        }
        if (isset($body['phone'])) {
            $updates['phone'] = sanitize_string($body['phone']);
        }
        if (isset($body['location'])) {
            $updates['location'] = sanitize_string($body['location']);
        }
        if (isset($body['bio'])) {
            $updates['bio'] = sanitize_string($body['bio']);
        }
        if (isset($body['password']) && trim($body['password']) !== '') {
            if (strlen($body['password']) < 8) {
                error_response(400, 'Password must be at least 8 characters.');
            }
            $updates['password'] = UserModel::hashPassword($body['password']);
        }
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $upload = handle_file_upload('avatar');
            if ($upload) {
                $updates['avatar'] = $upload['path'];
            }
        } elseif (isset($body['avatar'])) {
            $updates['avatar'] = self::normalize_avatar($body['avatar']);
        }
        if ($updates === []) {
            return ['data' => ['message' => 'No changes provided.', 'user' => self::sanitizeUserRecord($existing)]];
        }
        $updates['activity'] = ensure_array($existing['activity'] ?? []);
        $updates['activity'][] = ['action' => 'user_updated', 'description' => 'Profile was updated by admin.', 'at' => now()];
        $updated = UserModel::update($id, $updates);
        return ['data' => self::sanitizeUserRecord($updated)];
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        UserModel::delete($id);
        return ['message' => 'User deleted successfully.'];
    }
}
