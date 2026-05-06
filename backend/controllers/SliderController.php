<?php
require_once __DIR__ . '/../models/SliderModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class SliderController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'slider';
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = SliderModel::findBySlug($candidate, true);
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
        return SliderModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $slider = SliderModel::findById($id);
        if (!$slider) {
            error_response(404, 'Slider not found.');
        }
        return $slider;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $slider = SliderModel::findBySlug($slug, $includeAll);
        if (!$slider) {
            error_response(404, 'Slider not found.');
        }
        return $slider;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $slug = self::ensureUniqueSlug((string) ($body['slug'] ?? $body['title'] ?? ''));
        $payload = [
            'heading' => sanitize_string($body['heading'] ?? ''),
            'title' => sanitize_string($body['title'] ?? ''),
            'slug' => $slug,
            'subtitle' => sanitize_string($body['subtitle'] ?? ''),
            'image_alt' => sanitize_string($body['imageAlt'] ?? $body['title'] ?? ''),
            'button_text' => sanitize_string($body['buttonText'] ?? 'Get Started'),
            'button_link' => sanitize_string($body['buttonLink'] ?? '/services'),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        foreach (['image', 'video'] as $field) {
            $upload = handle_file_upload($field);
            if ($upload) {
                $payload[$field] = $upload['path'];
            }
        }
        $inserted = DataInserter::insert('sliders', $payload);
        return ['status' => 201, 'data' => $inserted];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['heading', 'title', 'subtitle', 'buttonText', 'buttonLink'] as $key) {
            if (array_key_exists($key, $body)) {
                $payload[strtolower(preg_replace('/([A-Z])/', '_$1', $key))] = sanitize_string($body[$key] ?? '');
            }
        }
        if (array_key_exists('imageAlt', $body)) {
            $payload['image_alt'] = sanitize_string($body['imageAlt'] ?? '');
        }
        if (array_key_exists('slug', $body) || array_key_exists('title', $body)) {
            $preferredSlug = (string) ($body['slug'] ?? $body['title'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        foreach (['image', 'video'] as $field) {
            $upload = handle_file_upload($field);
            if ($upload) {
                $payload[$field] = $upload['path'];
            }
            $removeKey = 'remove' . ucfirst($field);
            if (parse_boolean($body[$removeKey] ?? '', false)) {
                $payload[$field] = null;
            }
        }
        $updated = SliderModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Slider not found.');
        }
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = SliderModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Slider not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        SliderModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
