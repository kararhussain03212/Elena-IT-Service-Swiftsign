<?php
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/request_context.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class AuthMiddleware
{
    public static function protect(): array
    {
        $header = get_authorization_header();
        if (!$header) {
            error_response(401, 'Not authorized.');
        }

        if (!preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            error_response(401, 'Not authorized.');
        }

        $payload = jwt_decode($matches[1]);
        if (!$payload || empty($payload['id'])) {
            error_response(401, 'Invalid or expired token.');
        }

        $user = UserModel::findById((int) $payload['id']);
        if (!$user) {
            error_response(401, 'Not authorized.');
        }

        if (($user['status'] ?? '') !== 'active') {
            error_response(403, sprintf('Account is %s. Please contact an administrator.', $user['status'] ?? 'inactive'));
        }

        RequestContext::setUser($user);
        return $user;
    }
}
