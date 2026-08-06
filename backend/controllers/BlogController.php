<?php
require_once __DIR__ . '/../models/BlogModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class BlogController
{
    private static function ensureUniqueSlug(string $preferredSlug, ?int $ignoreId = null): string
    {
        $base = slugify($preferredSlug);
        if ($base === '') {
            $base = 'blog';
        }

        $candidate = $base;
        $suffix = 2;
        while (true) {
            $existing = BlogModel::findBySlug($candidate, true);
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

    private static function hasUploadedCoverImage(): bool
    {
        foreach (['coverImage', 'cover_image'] as $key) {
            if (!empty($_FILES[$key]) && (int) ($_FILES[$key]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
                return true;
            }
        }
        return false;
    }

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
        $title = sanitize_string($body['title'] ?? '');
        // The Quill/PrimeEditor rich-text body is stored as HTML and rendered
        // on the public site via dangerouslySetInnerHTML — sanitize it before
        // it ever reaches the database, not just at render time. Validation
        // runs against the sanitized value, so a submission that's entirely
        // disallowed markup (e.g. just a <script> tag) is correctly treated
        // as empty rather than silently saved as blank.
        $content = sanitize_html((string) ($body['content'] ?? ''));
        if ($title === '') {
            error_response(400, 'Title is required.', ['field' => 'title']);
        }
        if ($content === '') {
            error_response(400, 'Content is required.', ['field' => 'content']);
        }
        $payload = [
            'title' => $title,
            'slug' => self::ensureUniqueSlug((string) ($body['slug'] ?? $body['title'] ?? '')),
            'excerpt' => sanitize_string($body['excerpt'] ?? ''),
            'content' => $content,
            'author' => sanitize_string($body['author'] ?? 'Admin'),
            'read_time' => sanitize_string($body['readTime'] ?? '5 min read'),
            'category' => sanitize_string($body['category'] ?? 'Technology'),
            'tags' => parse_tags($body['tags'] ?? []),
            'published' => parse_boolean($body['published'] ?? '', false) ? 1 : 0,
        ];
        if (table_has_column('blogs', 'cover_alt')) {
            $payload['cover_alt'] = sanitize_string($body['coverAlt'] ?? $body['title'] ?? '');
        }
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
        $existing = BlogModel::findById($id);
        if (!$existing) {
            error_response(404, 'Blog not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (['title', 'excerpt', 'author', 'readTime', 'category'] as $field) {
            if (array_key_exists($field, $body)) {
                $column = strtolower(preg_replace('/([A-Z])/', '_$1', $field));
                $payload[$column] = sanitize_string($body[$field]);
            }
        }
        if (array_key_exists('content', $body)) {
            $payload['content'] = sanitize_html((string) $body['content']);
        }
        if (array_key_exists('coverAlt', $body) && table_has_column('blogs', 'cover_alt')) {
            $payload['cover_alt'] = sanitize_string($body['coverAlt'] ?? '');
        }
        if (array_key_exists('slug', $body) || array_key_exists('title', $body)) {
            $preferredSlug = (string) ($body['slug'] ?? $body['title'] ?? '');
            $payload['slug'] = self::ensureUniqueSlug($preferredSlug, $id);
        }
        if (array_key_exists('tags', $body)) {
            $payload['tags'] = parse_tags($body['tags']);
        }
        if (array_key_exists('published', $body)) {
            $payload['published'] = parse_boolean($body['published'], false) ? 1 : 0;
        }
        $hasNewUpload = self::hasUploadedCoverImage();
        $coverImage = self::resolveCoverImage($body);
        if ($coverImage !== null) {
            $payload['cover_image'] = $coverImage;
        }
        $updated = BlogModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Blog not found.');
        }
        if ($hasNewUpload) {
            delete_uploaded_file_if_present($existing['cover_image'] ?? null);
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
        $existing = BlogModel::findById($id);
        if (!$existing) {
            error_response(404, 'Blog not found.');
        }
        BlogModel::delete($id);
        delete_uploaded_file_if_present($existing['cover_image'] ?? null);
        return ['message' => 'Deleted'];
    }
}
