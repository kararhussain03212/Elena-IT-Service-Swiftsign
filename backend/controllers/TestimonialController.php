<?php
require_once __DIR__ . '/../models/TestimonialModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class TestimonialController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'testimonial';
        }
        if (!table_has_column('testimonials', 'slug')) {
            return $base;
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = TestimonialModel::findBySlug($candidate, true);
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
        return TestimonialModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = TestimonialModel::findById($id);
        if (!$item) {
            error_response(404, 'Testimonial not found.');
        }
        return $item;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = TestimonialModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Testimonial not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $name = sanitize_string($body['name'] ?? '');
        $message = sanitize_string($body['message'] ?? '');
        if ($name === '') {
            error_response(400, 'Name is required.', ['field' => 'name']);
        }
        if ($message === '') {
            error_response(400, 'Message is required.', ['field' => 'message']);
        }
        $payload = [
            'name' => $name,
            'role' => sanitize_string($body['role'] ?? ''),
            'company' => sanitize_string($body['company'] ?? ''),
            'message' => $message,
            'rating' => max(1, min(5, parse_integer($body['rating'] ?? 5, 5))),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        if (table_has_column('testimonials', 'slug')) {
            $payload['slug'] = self::ensureUniqueSlug((string) ($body['slug'] ?? $body['name'] ?? ''));
        }
        if (table_has_column('testimonials', 'avatar_alt')) {
            $payload['avatar_alt'] = sanitize_string($body['avatarAlt'] ?? $body['name'] ?? '');
        }
        $upload = handle_file_upload('avatar');
        if ($upload) {
            $payload['avatar'] = $upload['path'];
        }
        $created = DataInserter::insert('testimonials', $payload);
        return ['status' => 201, 'data' => $created];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = TestimonialModel::findById($id);
        if (!$existing) {
            error_response(404, 'Testimonial not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['name', 'role', 'company', 'message'] as $field) {
            if (array_key_exists($field, $body)) {
                $payload[$field] = sanitize_string($body[$field]);
            }
        }
        if (array_key_exists('avatarAlt', $body) && table_has_column('testimonials', 'avatar_alt')) {
            $payload['avatar_alt'] = sanitize_string($body['avatarAlt']);
        }
        if ((array_key_exists('slug', $body) || array_key_exists('name', $body)) && table_has_column('testimonials', 'slug')) {
            $preferredSlug = (string) ($body['slug'] ?? $body['name'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        if (array_key_exists('rating', $body)) {
            $payload['rating'] = max(1, min(5, parse_integer($body['rating'], 5)));
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $oldAvatar = null;
        $upload = handle_file_upload('avatar');
        if ($upload) {
            $payload['avatar'] = $upload['path'];
            $oldAvatar = $existing['avatar'] ?? null;
        }
        $updated = TestimonialModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Testimonial not found.');
        }
        delete_uploaded_file_if_present($oldAvatar);
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = TestimonialModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Testimonial not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = TestimonialModel::findById($id);
        if (!$existing) {
            error_response(404, 'Testimonial not found.');
        }
        TestimonialModel::delete($id);
        delete_uploaded_file_if_present($existing['avatar'] ?? null);
        return ['message' => 'Deleted'];
    }
}
