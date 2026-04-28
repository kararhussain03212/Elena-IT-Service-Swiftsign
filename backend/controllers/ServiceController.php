<?php
require_once __DIR__ . '/../models/ServiceModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class ServiceController
{
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
        $benefits = self::normalizeBenefits($body['benefits'] ?? []);
        $faqs = self::normalizeFaqs($body['faqs'] ?? []);
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
            try {
                if (ServiceModel::shouldUseExtrasTables()) {
                    ServiceModel::replaceBenefits($serviceId, $benefits);
                    ServiceModel::replaceFaqs($serviceId, $faqs);
                } elseif (ServiceModel::shouldUseExtrasColumns()) {
                    ServiceModel::update($serviceId, [
                        'benefits' => json_encode($benefits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        'faqs' => json_encode($faqs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ]);
                }
            } catch (Throwable $e) {
                // Ignore extras save failures to avoid breaking service create.
            }
        }

        return ['status' => 201, 'data' => ServiceModel::attachExtras(ServiceModel::findById($serviceId) ?: $inserted)];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
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
        $image1Upload = handle_file_upload('image1');
        if ($image1Upload) {
            $payload['image1'] = $image1Upload['path'];
        }
        $detailUpload = handle_file_upload('detailImage');
        if ($detailUpload) {
            $payload['detail_image'] = $detailUpload['path'];
        }
        $updated = ServiceModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Service not found.');
        }

        try {
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
        } catch (Throwable $e) {
            // Ignore extras save failures to avoid breaking service update.
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
        ServiceModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
