<?php
require_once __DIR__ . '/../models/TestimonialModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class TestimonialController
{
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

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $payload = [
            'name' => sanitize_string($body['name'] ?? ''),
            'role' => sanitize_string($body['role'] ?? ''),
            'company' => sanitize_string($body['company'] ?? ''),
            'message' => sanitize_string($body['message'] ?? ''),
            'rating' => parse_integer($body['rating'] ?? 5),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
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
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['name', 'role', 'company', 'message'] as $field) {
            if (array_key_exists($field, $body)) {
                $payload[$field] = sanitize_string($body[$field]);
            }
        }
        if (array_key_exists('rating', $body)) {
            $payload['rating'] = parse_integer($body['rating'], 5);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $upload = handle_file_upload('avatar');
        if ($upload) {
            $payload['avatar'] = $upload['path'];
        }
        $updated = TestimonialModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Testimonial not found.');
        }
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
        TestimonialModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
