<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../scripts/DataInserter.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/rbac.php';

$email = strtolower(trim(env('DEFAULT_ADMIN_EMAIL', '')));
$password = (string) env('DEFAULT_ADMIN_PASSWORD', '');

if ($email === '' || $password === '') {
    fwrite(STDERR, "DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD is missing in .env\n");
    exit(1);
}

$payload = [
    'name' => sanitize_string(env('DEFAULT_ADMIN_NAME', 'Main Admin')),
    'email' => $email,
    'password' => UserModel::hashPassword($password),
    'role' => 'admin',
    'status' => 'active',
    'permissions' => DEFAULT_ROLE_PERMISSIONS['admin'] ?? [],
    'designation' => sanitize_string(env('DEFAULT_ADMIN_DESIGNATION', '')),
    'phone' => sanitize_string(env('DEFAULT_ADMIN_PHONE', '')),
    'location' => sanitize_string(env('DEFAULT_ADMIN_LOCATION', '')),
    'bio' => '',
    'avatar' => '',
];

$existing = UserModel::findByEmail($email);

if ($existing) {
    UserModel::update((int) $existing['id'], $payload);
    $updated = UserModel::findByEmailWithPassword($email);
    $hash = (string) ($updated['password'] ?? '');
    echo "Updated admin user: {$email}\n";
    echo "ID: " . ($updated['id'] ?? 'n/a') . "\n";
    echo "HashPrefix: " . substr($hash, 0, 4) . "\n";
    echo "HashLength: " . strlen($hash) . "\n";
    exit(0);
}

$payload['activity'] = [
    [
        'action' => 'manual_admin_seed',
        'description' => 'Admin account created via SyncDefaultAdmin script.',
        'at' => now(),
    ],
];

DataInserter::insert('users', $payload, ['permissions', 'activity']);
$created = UserModel::findByEmailWithPassword($email);
$hash = (string) ($created['password'] ?? '');
echo "Created admin user: {$email}\n";
echo "ID: " . ($created['id'] ?? 'n/a') . "\n";
echo "HashPrefix: " . substr($hash, 0, 4) . "\n";
echo "HashLength: " . strlen($hash) . "\n";
