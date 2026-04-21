<?php
require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../scripts/DataInserter.php';
require_once __DIR__ . '/rbac.php';
require_once __DIR__ . '/helpers.php';

function ensure_default_roles(): void
{
    foreach (DEFAULT_ROLE_PERMISSIONS as $role => $permissions) {
        $existing = RoleModel::findByName($role);
        if ($existing) {
            RoleModel::update((int) $existing['id'], ['permissions' => $permissions]);
            continue;
        }
        DataInserter::insert('roles', ['name' => $role, 'permissions' => $permissions], ['permissions']);
    }
}

function ensure_default_admin_user(): void
{
    $email = strtolower(trim(env('DEFAULT_ADMIN_EMAIL', 'admin@swiftsignit.com')));
    if ($email === '') {
        return;
    }
    $existing = UserModel::findByEmail($email);
    if ($existing) {
        return;
    }

    $payload = [
        'name' => sanitize_string(env('DEFAULT_ADMIN_NAME', 'Main Admin')),
        'email' => $email,
        'password' => UserModel::hashPassword(env('DEFAULT_ADMIN_PASSWORD', 'admin123')),
        'role' => 'admin',
        'status' => 'active',
        'permissions' => DEFAULT_ROLE_PERMISSIONS['admin'] ?? [],
        'designation' => sanitize_string(env('DEFAULT_ADMIN_DESIGNATION', '')),
        'phone' => sanitize_string(env('DEFAULT_ADMIN_PHONE', '')),
        'location' => sanitize_string(env('DEFAULT_ADMIN_LOCATION', '')),
        'bio' => '',
        'avatar' => '',
        'activity' => [
            ['action' => 'bootstrap_user_created', 'description' => 'Default admin user created during bootstrap.', 'at' => now()],
        ],
    ];
    DataInserter::insert('users', $payload, ['permissions', 'activity']);
}
