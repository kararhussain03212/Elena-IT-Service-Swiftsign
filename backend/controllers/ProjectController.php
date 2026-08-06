<?php
require_once __DIR__ . '/../models/ProjectModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class ProjectController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'project';
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = ProjectModel::findBySlug($candidate, true);
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
        return ProjectModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = ProjectModel::findById($id);
        if (!$item) {
            error_response(404, 'Project not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $title = sanitize_string($body['title'] ?? '');
        if ($title === '') {
            error_response(400, 'Title is required.', ['field' => 'title']);
        }
        $payload = [
            'title' => $title,
            'slug' => self::ensureUniqueSlug((string) ($body['slug'] ?? $body['title'] ?? '')),
            'description' => sanitize_string($body['description'] ?? ''),
            'overview' => sanitize_string($body['overview'] ?? ''),
            'challenge' => sanitize_string($body['challenge'] ?? ''),
            'cover_image' => sanitize_string($body['coverImage'] ?? ''),
            'tags' => parse_tags($body['tags'] ?? ''),
            'category' => sanitize_string($body['category'] ?? ''),
            'status' => sanitize_string($body['status'] ?? 'Live'),
            'tech' => sanitize_string($body['tech'] ?? ''),
            'year' => sanitize_string($body['year'] ?? ''),
            'duration' => sanitize_string($body['duration'] ?? ''),
            'client' => sanitize_string($body['client'] ?? ''),
            'location' => sanitize_string($body['location'] ?? ''),
            'url' => sanitize_string($body['url'] ?? ''),
            'sort_order' => parse_integer($body['order'] ?? 0),
            'is_active' => parse_boolean($body['isActive'] ?? '', true) ? 1 : 0,
        ];
        if (table_has_column('projects', 'cover_alt')) {
            $payload['cover_alt'] = sanitize_string($body['coverAlt'] ?? $body['title'] ?? '');
        }
        $upload = handle_file_upload('coverImage');
        if ($upload) {
            $payload['cover_image'] = $upload['path'];
        }
        $inserted = DataInserter::insert('projects', $payload, ['tags']);
        return ['status' => 201, 'data' => $inserted];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = ProjectModel::findById($id);
        if (!$existing) {
            error_response(404, 'Project not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        $mapping = [
            'title' => 'title',
            'description' => 'description',
            'overview' => 'overview',
            'challenge' => 'challenge',
            'coverImage' => 'cover_image',
            'category' => 'category',
            'status' => 'status',
            'tech' => 'tech',
            'year' => 'year',
            'duration' => 'duration',
            'client' => 'client',
            'location' => 'location',
            'url' => 'url',
        ];
        foreach ($mapping as $key => $column) {
            if (array_key_exists($key, $body)) {
                $payload[$column] = sanitize_string($body[$key]);
            }
        }
        if (array_key_exists('coverAlt', $body) && table_has_column('projects', 'cover_alt')) {
            $payload['cover_alt'] = sanitize_string($body['coverAlt'] ?? '');
        }
        if (array_key_exists('slug', $body) || array_key_exists('title', $body)) {
            $preferredSlug = (string) ($body['slug'] ?? $body['title'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        if (array_key_exists('tags', $body)) {
            $payload['tags'] = parse_tags($body['tags']);
        }
        if (array_key_exists('order', $body)) {
            $payload['sort_order'] = parse_integer($body['order'], 0);
        }
        if (array_key_exists('isActive', $body)) {
            $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        }
        $oldCoverImage = null;
        $upload = handle_file_upload('coverImage');
        if ($upload) {
            $payload['cover_image'] = $upload['path'];
            $oldCoverImage = $existing['cover_image'] ?? null;
        }
        $updated = ProjectModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Project not found.');
        }
        delete_uploaded_file_if_present($oldCoverImage);
        return $updated;
    }

    public static function toggleActive(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = ProjectModel::toggleActive($id);
        if (!$result) {
            error_response(404, 'Project not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = ProjectModel::findById($id);
        if (!$existing) {
            error_response(404, 'Project not found.');
        }
        ProjectModel::delete($id);
        delete_uploaded_file_if_present($existing['cover_image'] ?? null);
        return ['message' => 'Deleted'];
    }
}
