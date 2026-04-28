<?php
require_once __DIR__ . '/../models/SectionContentModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class SectionContentController
{
    private static function normalizeContent($content)
    {
        if (is_string($content)) {
            $decoded = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
            return [];
        }
        if (is_array($content)) {
            return $content;
        }
        return [];
    }

    public static function uploadImage(array $context): array
    {
        $upload = handle_file_upload('image');
        if (!$upload) {
            error_response(400, 'Image file is required.');
        }
        $publicUrl = '/' . ltrim((string) ($upload['path'] ?? ''), '/');
        return [
            'filename' => $upload['filename'],
            'path' => $publicUrl,
            'url' => $publicUrl,
        ];
    }

    public static function list(array $context): array
    {
        $page = sanitize_string($context['query']['page'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        return SectionContentModel::list($page, $includeAll);
    }

    public static function getByKey(array $context): array
    {
        $key = sanitize_string($context['params']['key'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = SectionContentModel::findByKey($key, $includeAll);
        if (!$item) {
            if ($includeAll) {
                return ['data' => null];
            }
            error_response(404, 'Section content not found.');
        }
        return $item;
    }

    public static function getById(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = SectionContentModel::findById($id);
        if (!$item) {
            error_response(404, 'Section content not found.');
        }
        if (($context['query']['all'] ?? '') !== '1' && isset($item['is_active']) && $item['is_active'] === 0) {
            error_response(404, 'Section content not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $payload = [
            'page' => sanitize_string($body['page'] ?? ''),
            'key_name' => sanitize_string($body['key'] ?? ''),
            'content' => self::normalizeContent($body['content'] ?? []),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        $created = DataInserter::insert('section_contents', $payload, ['content']);
        return ['status' => 201, 'data' => $created];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $payload = [];
        if (array_key_exists('page', $body)) {
            $payload['page'] = sanitize_string($body['page']);
        }
        if (array_key_exists('key', $body)) {
            $payload['key_name'] = sanitize_string($body['key']);
        }
        if (array_key_exists('content', $body)) {
            $payload['content'] = self::normalizeContent($body['content']);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $updated = SectionContentModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Section content not found.');
        }
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = SectionContentModel::findById($id);
        if (!$existing) {
            error_response(404, 'Section content not found.');
        }
        $next = (int) !((bool) ($existing['is_active'] ?? 1));
        return SectionContentModel::update($id, ['is_active' => $next]);
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        SectionContentModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
