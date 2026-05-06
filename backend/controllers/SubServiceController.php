<?php
require_once __DIR__ . '/../models/SubServiceModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class SubServiceController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'sub-service';
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = SubServiceModel::findBySlug($candidate, true);
            if (!$existing) {
                return $candidate;
            }

            $existingId = (int) ($existing['id'] ?? $existing['_id'] ?? 0);
            if ($ignoreId !== null && $existingId === $ignoreId) {
                return $candidate;
            }

            $candidate = $base . '-' . $suffix;
            $suffix++;
        }
    }

    public static function list(array $context): array
    {
        $includeAll = ($context['query']['all'] ?? '') === '1';
        return SubServiceModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = SubServiceModel::findById($id);
        if (!$item) {
            error_response(404, 'Sub service not found.');
        }
        return $item;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = SubServiceModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Sub service not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $slug = self::ensureUniqueSlug((string) ($body['slug'] ?? $body['title'] ?? ''));
        $payload = [
            'title' => sanitize_string($body['title'] ?? ''),
            'slug' => $slug,
            'description' => sanitize_string($body['description'] ?? ''),
            'icon' => sanitize_string($body['icon'] ?? ''),
            'icon_alt' => sanitize_string($body['iconAlt'] ?? $body['title'] ?? ''),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        $upload = handle_file_upload('iconFile');
        if ($upload) {
            $payload['icon'] = $upload['path'];
        }
        $created = DataInserter::insert('sub_services', $payload);
        return ['status' => 201, 'data' => $created];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $payload = [];
        if (array_key_exists('title', $body)) {
            $payload['title'] = sanitize_string($body['title']);
        }
        if (array_key_exists('description', $body)) {
            $payload['description'] = sanitize_string($body['description']);
        }
        if (array_key_exists('iconAlt', $body)) {
            $payload['icon_alt'] = sanitize_string($body['iconAlt']);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        if (array_key_exists('icon', $body)) {
            $payload['icon'] = sanitize_string($body['icon']);
        }
        if (array_key_exists('slug', $body) || array_key_exists('title', $body)) {
            $preferredSlug = (string) ($body['slug'] ?? $body['title'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        $upload = handle_file_upload('iconFile');
        if ($upload) {
            $payload['icon'] = $upload['path'];
        }
        $updated = SubServiceModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Sub service not found.');
        }
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = SubServiceModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Sub service not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        SubServiceModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
