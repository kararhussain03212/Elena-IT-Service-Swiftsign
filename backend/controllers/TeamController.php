<?php
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class TeamController
{
    private static function normalizeSocialLinks($rawLinks): array
    {
        $links = ensure_array($rawLinks);
        if (!is_array($links) || empty($links)) {
            return [];
        }

        $normalized = [];

        if (is_assoc_array($links)) {
            foreach ($links as $platform => $url) {
                $name = sanitize_string($platform);
                $href = sanitize_string($url);
                if ($name === '' || $href === '' || $href === '#') {
                    continue;
                }
                $normalized[$name] = $href;
            }

            return $normalized;
        }

        foreach ($links as $item) {
            if (!is_array($item)) {
                continue;
            }

            $name = sanitize_string($item['name'] ?? $item['platform'] ?? $item['key'] ?? '');
            $href = sanitize_string($item['href'] ?? $item['url'] ?? $item['link'] ?? '');

            if ($name === '' || $href === '' || $href === '#') {
                continue;
            }

            $normalized[$name] = $href;
        }

        return $normalized;
    }

    private static function buildSocialLinksPayload(array $body, array $existing = [], bool $forCreate = false): ?array
    {
        $hasSocialLinksPayload = array_key_exists('socialLinks', $body) || array_key_exists('social_links', $body);
        $legacyKeys = ['facebook', 'instagram', 'linkedin'];

        $hasLegacyFields = false;
        foreach ($legacyKeys as $key) {
            if (array_key_exists($key, $body)) {
                $hasLegacyFields = true;
                break;
            }
        }

        if (!$hasSocialLinksPayload && !$hasLegacyFields) {
            return $forCreate ? [] : null;
        }

        $existingLinks = self::normalizeSocialLinks($existing['social_links'] ?? $existing['socialLinks'] ?? []);

        if ($hasSocialLinksPayload) {
            $incomingLinks = self::normalizeSocialLinks($body['socialLinks'] ?? $body['social_links'] ?? []);
            return $incomingLinks;
        }

        $nextLinks = $existingLinks;
        foreach ($legacyKeys as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }

            $value = sanitize_string($body[$key]);
            if ($value === '' || $value === '#') {
                unset($nextLinks[$key]);
                continue;
            }

            $nextLinks[$key] = $value;
        }

        return $nextLinks;
    }

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
        require_data_inserter();
        $body = $context['body'] ?? [];
        $socialLinksPayload = self::buildSocialLinksPayload($body, [], true) ?? [];

        $payload = [
            'name' => sanitize_string($body['name'] ?? ''),
            'slug' => slugify($body['slug'] ?? $body['name'] ?? ''),
            'role' => sanitize_string($body['role'] ?? ''),
            'bio' => sanitize_string($body['bio'] ?? ''),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
            'skills' => ensure_array($body['skills'] ?? []),
            'education' => ensure_array($body['education'] ?? []),
        ];
        if (table_has_column('team_members', 'image_alt')) {
            $payload['image_alt'] = sanitize_string($body['imageAlt'] ?? $body['name'] ?? '');
        }

        if (TeamModel::shouldUseSocialLinksColumn()) {
            $payload['social_links'] = $socialLinksPayload;
        }

        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }

        $jsonColumns = ['skills', 'education'];
        if (array_key_exists('social_links', $payload)) {
            $jsonColumns[] = 'social_links';
        }

        $created = DataInserter::insert('team_members', $payload, $jsonColumns);
        $memberId = (int) ($created['id'] ?? 0);
        if ($memberId > 0) {
            TeamModel::replaceSocialLinks($memberId, $socialLinksPayload);
        }

        $fresh = $memberId > 0 ? TeamModel::findById($memberId) : null;
        return ['status' => 201, 'data' => $fresh ?: $created];
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
        if (array_key_exists('imageAlt', $body) && table_has_column('team_members', 'image_alt')) {
            $payload['image_alt'] = sanitize_string($body['imageAlt'] ?? '');
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

        $socialLinksPayload = self::buildSocialLinksPayload($body, $existing, false);
        if ($socialLinksPayload !== null) {
            if (TeamModel::shouldUseSocialLinksColumn()) {
                $payload['social_links'] = $socialLinksPayload;
            }
        }

        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }

        $updated = TeamModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Team member not found.');
        }
        if ($socialLinksPayload !== null) {
            TeamModel::replaceSocialLinks($id, $socialLinksPayload);
        }

        $fresh = TeamModel::findById($id);
        return $fresh ?: $updated;
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
