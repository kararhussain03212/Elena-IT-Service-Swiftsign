<?php
require_once __DIR__ . '/../utils/rbac.php';
require_once __DIR__ . '/../utils/request_context.php';
require_once __DIR__ . '/../utils/helpers.php';

class PermissionMiddleware
{
    public static function requireAdmin(): void
    {
        $user = RequestContext::getUser();
        if (!$user) {
            error_response(401, 'Not authorized.');
        }
        if (normalize_role_value($user['role'] ?? '') !== 'admin') {
            error_response(403, 'Only admin can access user management.');
        }
    }

    public static function requirePermission(string $permission): void
    {
        $user = RequestContext::getUser();
        if (!$user) {
            error_response(401, 'Not authorized.');
        }

        $resolved = self::resolvePermissions($user);
        if (!has_permission($resolved, $permission)) {
            error_response(403, sprintf('Missing permission: %s', $permission));
        }
    }

    private static function resolvePermissions(array $user): array
    {
        $role = normalize_role_value($user['role'] ?? 'viewer');
        if (array_key_exists('permissions', $user) && $user['permissions'] !== null) {
            $permissions = $user['permissions'];
            return normalize_permissions_list($permissions);
        }
        return DEFAULT_ROLE_PERMISSIONS[$role] ?? [];
    }
}
