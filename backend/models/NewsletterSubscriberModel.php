<?php
require_once __DIR__ . '/BaseModel.php';

class NewsletterSubscriberModel extends BaseModel
{
    protected static string $table = 'newsletter_subscribers';

    public static function findByEmail(string $email): ?array
    {
        $sql = 'SELECT * FROM newsletter_subscribers WHERE email = :email LIMIT 1';
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(string $email, string $sourcePage = ''): array
    {
        $sql = 'INSERT INTO newsletter_subscribers (email, source_page, subscribed_at) VALUES (:email, :source_page, :subscribed_at)';
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute([
            'email' => $email,
            'source_page' => $sourcePage !== '' ? $sourcePage : null,
            'subscribed_at' => now(),
        ]);
        return self::findById((int) self::getConnection()->lastInsertId());
    }

    public static function paginate(int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $sql = 'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT :offset, :limit';
        $stmt = self::getConnection()->prepare($sql);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $total = (int) self::getConnection()->query('SELECT COUNT(*) FROM newsletter_subscribers')->fetchColumn();

        return ['items' => $items, 'total' => $total];
    }

    public static function all(): array
    {
        return self::fetchAll('', [], 'subscribed_at DESC');
    }
}
