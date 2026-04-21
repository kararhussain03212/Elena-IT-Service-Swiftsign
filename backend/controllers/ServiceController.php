<?php
require_once __DIR__ . '/../models/ServiceModel.php';
require_once __DIR__ . '/../scripts/DataInserter.php';
require_once __DIR__ . '/../utils/helpers.php';

class ServiceController
{
    public static function list(array $context): array
    {
        $includeAll = ($context['query']['all'] ?? '') === '1';
        return ServiceModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = ServiceModel::findById($id);
        if (!$item) {
            error_response(404, 'Service not found.');
        }
        return $item;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = ServiceModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Service not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        $body = $context['body'] ?? [];
        $payload = [
            'title' => sanitize_string($body['title'] ?? ''),
            'slug' => slugify($body['slug'] ?? $body['title'] ?? ''),
            'short_description' => sanitize_string($body['shortDescription'] ?? ''),
            'description' => sanitize_string($body['description'] ?? ''),
            'description1' => sanitize_string($body['description1'] ?? ''),
            'description2' => sanitize_string($body['description2'] ?? ''),
            'icon' => sanitize_string($body['icon'] ?? ''),
            'image1' => sanitize_string($body['image1'] ?? ''),
            'detail_image' => sanitize_string($body['detailImage'] ?? $body['image1'] ?? ''),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }
        $inserted = DataInserter::insert('services', $payload);
        return ['status' => 201, 'data' => $inserted];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = ServiceModel::findById($id);
        if (!$existing) {
            error_response(404, 'Service not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        foreach ([
            'title',
            'slug',
            'shortDescription',
            'description',
            'description1',
            'description2',
            'icon',
            'image1',
            'detailImage',
        ] as $key) {
            if (array_key_exists($key, $body)) {
                $column = strtolower(preg_replace('/([A-Z])/', '_$1', $key));
                $payload[$column] = sanitize_string($body[$key] ?? '');
            }
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }
        $updated = ServiceModel::update($id, $payload);
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = ServiceModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Service not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        ServiceModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
