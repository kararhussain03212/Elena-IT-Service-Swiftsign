<?php
require_once __DIR__ . '/../models/BlogModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class BlogController
{
    private static function resolveCoverImage(array $body = []): ?string
    {
        $uploadKeys = ['coverImage', 'cover_image'];

        foreach ($uploadKeys as $key) {
            if (!empty($_FILES[$key])) {
                $errorCode = (int) ($_FILES[$key]['error'] ?? UPLOAD_ERR_NO_FILE);
                if ($errorCode !== UPLOAD_ERR_OK) {
                    continue;
                }

                $upload = handle_file_upload($key);
                if ($upload) {
                    return $upload['url'] ?? ('/' . ltrim((string) ($upload['path'] ?? ''), '/'));
                }
            }
        }

        foreach ($uploadKeys as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }

            $normalizedPath = normalize_upload_path((string) $body[$key]);
            if ($normalizedPath !== '') {
                return $normalizedPath;
            }
            return null;
        }

        return null;
    }

    public static function list(array $context): array
    {
        $includeAll = ($context['query']['all'] ?? '') === '1';
        return BlogModel::list($includeAll);
    }

    public static function show(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $item = BlogModel::findById($id);
        if (!$item) {
            error_response(404, 'Blog not found.');
        }
        return $item;
    }

    public static function showBySlug(array $context): array
    {
        $slug = sanitize_string($context['params']['slug'] ?? '');
        $includeAll = ($context['query']['all'] ?? '') === '1';
        $item = BlogModel::findBySlug($slug, $includeAll);
        if (!$item) {
            error_response(404, 'Blog not found.');
        }
        return $item;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $payload = [
            'title' => sanitize_string($body['title'] ?? ''),
            'slug' => slugify($body['slug'] ?? $body['title'] ?? ''),
            'excerpt' => sanitize_string($body['excerpt'] ?? ''),
            'content' => $body['content'] ?? '',
            'author' => sanitize_string($body['author'] ?? 'Admin'),
            'read_time' => sanitize_string($body['readTime'] ?? '5 min read'),
            'category' => sanitize_string($body['category'] ?? 'Technology'),
            'tags' => parse_tags($body['tags'] ?? []),
            'published' => parse_boolean($body['published'] ?? '', false) ? 1 : 0,
        ];
        $coverImage = self::resolveCoverImage($body);
        if ($coverImage !== null) {
            $payload['cover_image'] = $coverImage;
        }
        $created = DataInserter::insert('blogs', $payload, ['tags']);
        return ['status' => 201, 'data' => $created];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['title', 'slug', 'excerpt', 'content', 'author', 'readTime', 'category'] as $field) {
            if (array_key_exists($field, $body)) {
                $column = strtolower(preg_replace('/([A-Z])/', '_$1', $field));
                $payload[$column] = sanitize_string($body[$field]);
            }
        }
        if (array_key_exists('tags', $body)) {
            $payload['tags'] = parse_tags($body['tags']);
        }
        if (array_key_exists('published', $body)) {
            $payload['published'] = parse_boolean($body['published'], false) ? 1 : 0;
        }
        $coverImage = self::resolveCoverImage($body);
        if ($coverImage !== null) {
            $payload['cover_image'] = $coverImage;
        }
        $updated = BlogModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Blog not found.');
        }
        return $updated;
    }

    public static function togglePublished(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $result = BlogModel::togglePublished($id);
        if (!$result) {
            error_response(404, 'Blog not found.');
        }
        return $result;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        BlogModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
