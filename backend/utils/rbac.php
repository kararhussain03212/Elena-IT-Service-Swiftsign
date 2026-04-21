<?php
const USER_ROLES = ['admin', 'editor', 'viewer'];
const USER_STATUSES = ['active', 'suspended', 'pending'];
const PERMISSIONS = ['add_data', 'edit_data', 'delete_data', 'publish_data'];
const DEFAULT_ROLE_PERMISSIONS = [
    'admin' => PERMISSIONS,
    'editor' => ['add_data', 'edit_data', 'publish_data'],
    'viewer' => [],
];
const LEGACY_ROLE_ALIASES = [
    'super_admin' => 'admin',
    'manager' => 'editor',
    'user' => 'viewer',
];
const LEGACY_PERMISSION_ALIASES = [
    'create_user' => 'add_data',
    'edit_user' => 'edit_data',
    'delete_user' => 'delete_data',
    'view_users' => '',
];

function normalize_role_value($value): string
{
    $value = strtolower(trim((string) ($value ?? '')));
    return LEGACY_ROLE_ALIASES[$value] ?? $value;
}

function normalize_permission_value($value): string
{
    $value = strtolower(trim((string) ($value ?? '')));
    if ($value === '') {
        return '';
    }
    return LEGACY_PERMISSION_ALIASES[$value] ?? $value;
}

function normalize_permissions_list($value): array
{
    if ($value === null) {
        return [];
    }
    $items = is_array($value) ? $value : [$value];
    $normalized = [];
    foreach ($items as $item) {
        $permission = normalize_permission_value($item);
        if ($permission !== '' && in_array($permission, PERMISSIONS, true)) {
            $normalized[$permission] = true;
        }
    }
    return array_keys($normalized);
}

function has_permission(array $permissions, string $required): bool
{
    return in_array($required, $permissions, true);
}
