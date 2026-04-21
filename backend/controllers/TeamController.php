<?php
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../scripts/DataInserter.php';
require_once __DIR__ . '/../utils/helpers.php';

class TeamController
{
    public static function list(array $context): array
    {
        $includeAll = ($context['query']['all'] ?? '') === '1';
        return TeamModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = TeamModel::findById($id);
        if (!$item) {
            error_response(404, 'Team member not found.');
        }
        return $item;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = TeamModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Team member not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        $body = $context['body'] ?? [];
        $payload = [
            'name' => sanitize_string($body['name'] ?? ''),
            'slug' => slugify($body['slug'] ?? $body['name'] ?? ''),
            'role' => sanitize_string($body['role'] ?? ''),
            'bio' => sanitize_string($body['bio'] ?? ''),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
            'skills' => ensure_array($body['skills'] ?? []),
            'education' => ensure_array($body['education'] ?? []),
            'social_links' => [
                'facebook' => sanitize_string($body['socialLinks']['facebook'] ?? $body['facebook'] ?? '#'),
                'instagram' => sanitize_string($body['socialLinks']['instagram'] ?? $body['instagram'] ?? '#'),
                'linkedin' => sanitize_string($body['socialLinks']['linkedin'] ?? $body['linkedin'] ?? '#'),
            ],
        ];
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }
        $created = DataInserter::insert('team_members', $payload, ['skills', 'education', 'social_links']);
        return ['status' => 201, 'data' => $created];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = TeamModel::findById($id);
        if (!$existing) {
            error_response(404, 'Team member not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['name', 'slug', 'role', 'bio'] as $field) {
            if (array_key_exists($field, $body)) {
                $column = strtolower(preg_replace('/([A-Z])/', '_$1', $field));
                $payload[$column] = sanitize_string($body[$field]);
            }
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        if (array_key_exists('skills', $body)) {
            $payload['skills'] = ensure_array($body['skills']);
        }
        if (array_key_exists('education', $body)) {
            $payload['education'] = ensure_array($body['education']);
        }
        if (
            array_key_exists('socialLinks', $body) ||
            array_key_exists('facebook', $body) ||
            array_key_exists('instagram', $body) ||
            array_key_exists('linkedin', $body)
        ) {
            $payload['social_links'] = [
                'facebook' => sanitize_string($body['socialLinks']['facebook'] ?? $body['facebook'] ?? ($existing['social_links']['facebook'] ?? '#')),
                'instagram' => sanitize_string($body['socialLinks']['instagram'] ?? $body['instagram'] ?? ($existing['social_links']['instagram'] ?? '#')),
                'linkedin' => sanitize_string($body['socialLinks']['linkedin'] ?? $body['linkedin'] ?? ($existing['social_links']['linkedin'] ?? '#')),
            ];
        }
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }
        $updated = TeamModel::update($id, $payload);
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = TeamModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Team member not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        TeamModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
