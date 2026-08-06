<?php
require_once __DIR__ . '/../models/ServiceModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class ServiceController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'service';
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = ServiceModel::findBySlug($candidate, true);
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

    private static function normalizeBenefits($value): array
    {
        $items = ensure_array($value);
        $output = [];
        foreach ($items as $item) {
            $text = sanitize_string($item ?? '');
            if ($text !== '') {
                $output[] = $text;
            }
        }
        return array_values($output);
    }

    private static function normalizeFaqs($value): array
    {
        $items = ensure_array($value);
        $output = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $question = sanitize_string($item['question'] ?? '');
            $answer = sanitize_string($item['answer'] ?? '');
            if ($question === '' && $answer === '') {
                continue;
            }
            $output[] = [
                'question' => $question,
                'answer' => $answer,
            ];
        }
        return array_values($output);
    }

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
        return ServiceModel::attachExtras($item);
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = ServiceModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Service not found.');
        }
        return ServiceModel::attachExtras($item);
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $title = sanitize_string($body['title'] ?? '');
        if ($title === '') {
            error_response(400, 'Title is required.', ['field' => 'title']);
        }
        $benefits = self::normalizeBenefits($body['benefits'] ?? []);
        $faqs = self::normalizeFaqs($body['faqs'] ?? []);
        $slug = self::ensureUniqueSlug((string) ($body['slug'] ?? $body['title'] ?? ''));
        $payload = [
            'title' => sanitize_string($body['title'] ?? ''),
            'slug' => $slug,
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
        if (table_has_column('services', 'image_alt')) {
            $payload['image_alt'] = sanitize_string($body['imageAlt'] ?? $body['title'] ?? '');
        }
        if (table_has_column('services', 'image1_alt')) {
            $payload['image1_alt'] = sanitize_string($body['image1Alt'] ?? '');
        }
        if (table_has_column('services', 'detail_image_alt')) {
            $payload['detail_image_alt'] = sanitize_string($body['detailImageAlt'] ?? $body['image1Alt'] ?? '');
        }
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
        }
        $image1Upload = handle_file_upload('image1');
        if ($image1Upload) {
            $payload['image1'] = $image1Upload['path'];
            if (empty($payload['detail_image'])) {
                $payload['detail_image'] = $image1Upload['path'];
            }
        }
        $detailUpload = handle_file_upload('detailImage');
        if ($detailUpload) {
            $payload['detail_image'] = $detailUpload['path'];
        }
        $inserted = DataInserter::insert('services', $payload);

        $serviceId = (int) ($inserted['id'] ?? 0);
        if ($serviceId > 0) {
            // Let a sync failure propagate: the global handler in public/index.php
            // turns it into a proper 500 instead of silently returning success
            // while benefits/FAQs were never saved.
            if (ServiceModel::shouldUseExtrasTables()) {
                ServiceModel::replaceBenefits($serviceId, $benefits);
                ServiceModel::replaceFaqs($serviceId, $faqs);
            } elseif (ServiceModel::shouldUseExtrasColumns()) {
                ServiceModel::update($serviceId, [
                    'benefits' => json_encode($benefits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'faqs' => json_encode($faqs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ]);
            }
        }

        return ['status' => 201, 'data' => ServiceModel::attachExtras(ServiceModel::findById($serviceId) ?: $inserted)];
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
        if (array_key_exists('imageAlt', $body) && table_has_column('services', 'image_alt')) {
            $payload['image_alt'] = sanitize_string($body['imageAlt'] ?? '');
        }
        if (array_key_exists('image1Alt', $body) && table_has_column('services', 'image1_alt')) {
            $payload['image1_alt'] = sanitize_string($body['image1Alt'] ?? '');
        }
        if (array_key_exists('detailImageAlt', $body) && table_has_column('services', 'detail_image_alt')) {
            $payload['detail_image_alt'] = sanitize_string($body['detailImageAlt'] ?? '');
        }
        if (!table_has_column('services', 'image_alt')) {
            unset($payload['image_alt']);
        }
        if (!table_has_column('services', 'image1_alt')) {
            unset($payload['image1_alt']);
        }
        if (!table_has_column('services', 'detail_image_alt')) {
            unset($payload['detail_image_alt']);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('slug', $body) || array_key_exists('title', $body)) {
            $preferredSlug = (string) ($body['slug'] ?? $body['title'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $oldFileValues = [];
        $upload = handle_file_upload('image');
        if ($upload) {
            $payload['image'] = $upload['path'];
            $oldFileValues[] = $existing['image'] ?? null;
        }
        $image1Upload = handle_file_upload('image1');
        if ($image1Upload) {
            $payload['image1'] = $image1Upload['path'];
            $oldFileValues[] = $existing['image1'] ?? null;
        }
        $detailUpload = handle_file_upload('detailImage');
        if ($detailUpload) {
            $payload['detail_image'] = $detailUpload['path'];
            $oldFileValues[] = $existing['detail_image'] ?? null;
        }
        $updated = ServiceModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Service not found.');
        }
        foreach ($oldFileValues as $oldValue) {
            delete_uploaded_file_if_present($oldValue);
        }

        // Let a sync failure propagate: the global handler in public/index.php
        // turns it into a proper 500 instead of silently returning success
        // while benefits/FAQs were never saved.
        if (ServiceModel::shouldUseExtrasTables()) {
            if (array_key_exists('benefits', $body)) {
                ServiceModel::replaceBenefits($id, self::normalizeBenefits($body['benefits']));
            }
            if (array_key_exists('faqs', $body)) {
                ServiceModel::replaceFaqs($id, self::normalizeFaqs($body['faqs']));
            }
        } elseif (ServiceModel::shouldUseExtrasColumns()) {
            $extrasPayload = [];
            if (array_key_exists('benefits', $body)) {
                $extrasPayload['benefits'] = json_encode(
                    self::normalizeBenefits($body['benefits']),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                );
            }
            if (array_key_exists('faqs', $body)) {
                $extrasPayload['faqs'] = json_encode(
                    self::normalizeFaqs($body['faqs']),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                );
            }
            if (!empty($extrasPayload)) {
                $updated = ServiceModel::update($id, $extrasPayload);
            }
        }

        return ServiceModel::attachExtras($updated ?: []);
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
        $existing = ServiceModel::findById($id);
        if (!$existing) {
            error_response(404, 'Service not found.');
        }
        ServiceModel::delete($id);
        delete_uploaded_file_if_present($existing['image'] ?? null);
        delete_uploaded_file_if_present($existing['image1'] ?? null);
        delete_uploaded_file_if_present($existing['detail_image'] ?? null);
        return ['message' => 'Deleted'];
    }
}
