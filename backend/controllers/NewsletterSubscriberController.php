<?php
require_once __DIR__ . '/../models/NewsletterSubscriberModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class NewsletterSubscriberController
{
    public static function create(array $context): array
    {
        $body = $context['body'] ?? [];
        $email = sanitize_string($body['email'] ?? '');
        $sourcePage = sanitize_string($body['sourcePage'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response(400, 'A valid email is required.');
        }

        $existing = NewsletterSubscriberModel::findByEmail($email);
        if ($existing) {
            error_response(409, "You're already subscribed with this email.");
        }

        $created = NewsletterSubscriberModel::create($email, $sourcePage);
        return [
            'status' => 201,
            'data' => [
                'message' => 'Thank you for subscribing!',
                'subscriber' => $created,
            ],
        ];
    }

    public static function list(array $context): array
    {
        $query = $context['query'] ?? [];
        if (($query['export'] ?? '') === 'csv') {
            return self::exportCsv();
        }

        $page = max(1, parse_integer($query['page'] ?? 1, 1));
        $limit = max(1, parse_integer($query['limit'] ?? 20, 20));
        $result = NewsletterSubscriberModel::paginate($page, $limit);
        $total = (int) ($result['total'] ?? 0);
        $pages = max(1, (int) ceil($total / $limit));

        return [
            'items' => $result['items'] ?? [],
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => $pages,
        ];
    }

    private static function exportCsv(): void
    {
        $subscribers = NewsletterSubscriberModel::all();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="newsletter-subscribers.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['Email', 'Source Page', 'Subscribed At']);
        foreach ($subscribers as $subscriber) {
            fputcsv($out, [
                $subscriber['email'] ?? '',
                $subscriber['source_page'] ?? '',
                $subscriber['subscribed_at'] ?? '',
            ]);
        }
        fclose($out);
        exit;
    }
}
