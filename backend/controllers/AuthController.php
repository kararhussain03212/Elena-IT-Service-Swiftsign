<?php
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/rbac.php';
require_once __DIR__ . '/../utils/request_context.php';

class AuthController
{
    private static function getAuthenticatedUser(): array
    {
        $user = RequestContext::getUser();
        if (!$user) {
            error_response(401, 'Not authorized.');
        }
        return $user;
    }

    private static function sanitizeUser(array $user): array
    {
        unset($user['password']);
        $normalizedRole = normalize_role_value($user['role'] ?? 'viewer');
        if (array_key_exists('permissions', $user) && $user['permissions'] !== null) {
            $resolved = normalize_permissions_list($user['permissions']);
        } else {
            $resolved = DEFAULT_ROLE_PERMISSIONS[$normalizedRole] ?? [];
        }
        return array_merge($user, [
            'role' => $normalizedRole,
            'permissions' => $resolved,
        ]);
    }

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

    public static function register(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $name = sanitize_string($body['name'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';

        if ($name === '' || $email === '' || $password === '') {
            error_response(400, 'Name, email and password are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response(400, 'A valid email is required.');
        }
        $existing = UserModel::findByEmail($email);
        if ($existing) {
            error_response(409, 'Email already exists.');
        }

        $payload = [
            'name' => $name,
            'email' => $email,
            'password' => UserModel::hashPassword($password),
            'role' => 'viewer',
            'status' => 'active',
            'permissions' => DEFAULT_ROLE_PERMISSIONS['viewer'],
            'designation' => '',
            'phone' => '',
            'location' => '',
            'bio' => '',
            'avatar' => '',
            'activity' => [
                ['action' => 'user_registered', 'description' => 'User registered via auth API.', 'at' => now()],
            ],
        ];
        $created = DataInserter::insert('users', $payload, ['permissions', 'activity']);
        $token = jwt_encode(['id' => (int) $created['id']]);
        return [
            'status' => 201,
            'data' => [
                'token' => $token,
                'user' => self::sanitizeUser($created),
            ],
        ];
    }

    public static function login(array $context): array
    {
        $body = $context['body'] ?? [];
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';

        if ($email === '' || $password === '') {
            error_response(400, 'Email and password are required.');
        }
        $user = UserModel::findByEmailWithPassword($email);
        if (!$user || !password_verify($password, $user['password'] ?? '')) {
            error_response(401, 'Invalid credentials.');
        }
        if (($user['status'] ?? '') !== 'active') {
            error_response(403, sprintf('Account is %s. Please contact an administrator.', $user['status'] ?? 'inactive'));
        }

        $activity = ensure_array($user['activity'] ?? []);
        $activity[] = [
            'action' => 'login',
            'description' => 'User signed in successfully.',
            'at' => now(),
        ];
        $updated = UserModel::update((int) $user['id'], [
            'last_login' => now(),
            'activity' => $activity,
        ]);

        $token = jwt_encode(['id' => (int) $user['id']]);
        return [
            'data' => [
                'token' => $token,
                'user' => self::sanitizeUser($updated ?? $user),
            ],
        ];
    }

    public static function getMe(array $context): array
    {
        $user = self::getAuthenticatedUser();
        $fresh = UserModel::findById((int) $user['id']);
        return self::sanitizeUser($fresh ?? $user);
    }

    public static function updateMe(array $context): array
    {
        $user = self::getAuthenticatedUser();
        $body = $context['body'] ?? [];
        $updates = [];
        $changed = [];

        if (array_key_exists('name', $body)) {
            $nextName = sanitize_string($body['name']);
            if ($nextName === '') {
                error_response(400, 'Full name is required.');
            }
            if ($nextName !== $user['name']) {
                $updates['name'] = $nextName;
                $changed[] = 'name';
            }
        }

        if (array_key_exists('email', $body)) {
            $nextEmail = strtolower(trim($body['email']));
            if (!filter_var($nextEmail, FILTER_VALIDATE_EMAIL)) {
                error_response(400, 'A valid email is required.');
            }
            if ($nextEmail !== $user['email']) {
                $exists = UserModel::findByEmail($nextEmail);
                if ($exists && (int) $exists['id'] !== (int) $user['id']) {
                    error_response(409, 'Email already exists.');
                }
                $updates['email'] = $nextEmail;
                $changed[] = 'email';
            }
        }

        if (array_key_exists('designation', $body)) {
            $value = sanitize_string($body['designation']);
            if (strlen($value) > 120) {
                error_response(400, 'Designation must be 120 characters or less.');
            }
            $updates['designation'] = $value;
            $changed[] = 'designation';
        }

        if (array_key_exists('phone', $body)) {
            $value = sanitize_string($body['phone']);
            if (strlen($value) > 40) {
                error_response(400, 'Phone must be 40 characters or less.');
            }
            $updates['phone'] = $value;
            $changed[] = 'phone';
        }

        if (array_key_exists('location', $body)) {
            $value = sanitize_string($body['location']);
            if (strlen($value) > 120) {
                error_response(400, 'Location must be 120 characters or less.');
            }
            $updates['location'] = $value;
            $changed[] = 'location';
        }

        if (array_key_exists('bio', $body)) {
            $value = sanitize_string($body['bio']);
            if (strlen($value) > 500) {
                error_response(400, 'Bio must be 500 characters or less.');
            }
            $updates['bio'] = $value;
            $changed[] = 'bio';
        }

        $upload = handle_file_upload('avatar');
        if ($upload) {
            $updates['avatar'] = $upload['path'];
            $changed[] = 'avatar';
        } elseif (array_key_exists('avatar', $body)) {
            $value = self::normalize_avatar($body['avatar']);
            if ($value !== $user['avatar']) {
                $updates['avatar'] = $value;
                $changed[] = 'avatar';
            }
        }

        if (empty($updates)) {
            return ['data' => ['message' => 'No profile changes detected.', 'user' => self::sanitizeUser($user)]];
        }

        $activity = ensure_array($user['activity'] ?? []);
        $activity[] = [
            'action' => 'profile_updated',
            'description' => 'Updated profile fields: ' . implode(', ', $changed) . '.',
            'at' => now(),
        ];
        $updates['activity'] = $activity;

        $updated = UserModel::update((int) $user['id'], $updates);
        return ['data' => ['message' => 'Profile updated successfully.', 'user' => self::sanitizeUser($updated ?? $user)]];
    }

    public static function changeMyPassword(array $context): array
    {
        $user = self::getAuthenticatedUser();
        $body = $context['body'] ?? [];
        $current = $body['currentPassword'] ?? '';
        $new = $body['newPassword'] ?? '';

        if ($current === '' || $new === '') {
            error_response(400, 'Current password and new password are required.');
        }
        if (strlen($new) < 8) {
            error_response(400, 'New password must be at least 8 characters.');
        }
        if ($current === $new) {
            error_response(400, 'New password must be different from current password.');
        }

        $fresh = UserModel::findByEmailWithPassword($user['email']);
        if (!$fresh || !password_verify($current, $fresh['password'] ?? '')) {
            error_response(401, 'Current password is incorrect.');
        }

        $activity = ensure_array($fresh['activity'] ?? []);
        $activity[] = [
            'action' => 'password_changed',
            'description' => 'User changed account password.',
            'at' => now(),
        ];
        UserModel::update((int) $user['id'], [
            'password' => UserModel::hashPassword($new),
            'activity' => $activity,
        ]);

        return ['data' => ['message' => 'Password changed successfully.']];
    }
}
