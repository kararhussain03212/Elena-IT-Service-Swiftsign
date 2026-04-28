<?php
require_once __DIR__ . '/BaseModel.php';

class TeamModel extends BaseModel
{
    protected static string $table = 'team_members';
    protected static array $jsonColumns = ['skills', 'education', 'social_links'];
    private const DEFAULT_SOCIAL_PLATFORMS = ['facebook', 'instagram', 'linkedin'];

    private static ?bool $socialLinksTableReady = null;
    private static ?bool $socialLinksColumnReady = null;

    private static function socialLinksTableExist(): bool
    {
        if (self::$socialLinksTableReady !== null) {
            return self::$socialLinksTableReady;
        }

        try {
            $stmt = self::getConnection()->prepare(
                'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
            );
            $stmt->execute(['table' => 'team_social_links']);
            self::$socialLinksTableReady = (bool) $stmt->fetchColumn();
        } catch (Throwable $e) {
            self::$socialLinksTableReady = false;
        }

        return self::$socialLinksTableReady;
    }

    private static function socialLinksColumnExists(): bool
    {
        if (self::$socialLinksColumnReady !== null) {
            return self::$socialLinksColumnReady;
        }

        try {
            $stmt = self::getConnection()->prepare(
                'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
            );
            $stmt->execute(['table' => 'team_members', 'column' => 'social_links']);
            self::$socialLinksColumnReady = (bool) $stmt->fetchColumn();
        } catch (Throwable $e) {
            self::$socialLinksColumnReady = false;
        }

        return self::$socialLinksColumnReady;
    }

    public static function shouldUseSocialLinksTable(): bool
    {
        return self::socialLinksTableExist();
    }

    public static function shouldUseSocialLinksColumn(): bool
    {
        return self::socialLinksColumnExists();
    }

    private static function normalizeSocialLinks($rawLinks): array
    {
        $links = ensure_array($rawLinks);
        if (!is_array($links) || empty($links)) {
            return [];
        }

        $normalized = [];

        if (is_assoc_array($links)) {
            foreach ($links as $platform => $url) {
                $name = sanitize_string($platform);
                $href = sanitize_string($url);
                if ($name === '' || $href === '' || $href === '#') {
                    continue;
                }
                $normalized[$name] = $href;
            }

            return $normalized;
        }

        foreach ($links as $item) {
            if (!is_array($item)) {
                continue;
            }

            $name = sanitize_string($item['name'] ?? $item['platform'] ?? $item['key'] ?? '');
            $href = sanitize_string($item['href'] ?? $item['url'] ?? $item['link'] ?? '');

            if ($name === '' || $href === '' || $href === '#') {
                continue;
            }

            $normalized[$name] = $href;
        }

        return $normalized;
    }

    private static function syncSocialLinksColumn(int $teamMemberId, array $socialLinks): void
    {
        if (!self::socialLinksColumnExists()) {
            return;
        }

        $storedLinks = array_fill_keys(self::DEFAULT_SOCIAL_PLATFORMS, '#');
        foreach ($socialLinks as $platform => $url) {
            $name = strtolower(sanitize_string($platform));
            $href = sanitize_string($url);
            if ($name === '' || $href === '' || $href === '#') {
                continue;
            }
            $storedLinks[$name] = $href;
        }

        $stmt = self::getConnection()->prepare(
            'UPDATE team_members SET social_links = :social_links, updated_at = :updated_at WHERE id = :id'
        );
        $stmt->execute([
            'id' => $teamMemberId,
            'social_links' => json_encode($storedLinks, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'updated_at' => now(),
        ]);
    }

    public static function getSocialLinks(int $teamMemberId): array
    {
        if ($teamMemberId <= 0) {
            return [];
        }

        if (self::socialLinksTableExist()) {
            $stmt = self::getConnection()->prepare(
                'SELECT platform_name, url FROM team_social_links WHERE team_member_id = :id ORDER BY sort_order ASC, id ASC'
            );
            $stmt->execute(['id' => $teamMemberId]);
            $rows = $stmt->fetchAll() ?: [];

            $links = [];
            foreach ($rows as $row) {
                $name = sanitize_string($row['platform_name'] ?? '');
                $href = sanitize_string($row['url'] ?? '');
                if ($name === '' || $href === '' || $href === '#') {
                    continue;
                }
                $links[$name] = $href;
            }

            return $links;
        }

        if (!self::socialLinksColumnExists()) {
            return [];
        }

        $stmt = self::getConnection()->prepare('SELECT social_links FROM team_members WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $teamMemberId]);
        $raw = $stmt->fetchColumn();
        return self::normalizeSocialLinks($raw);
    }

    public static function replaceSocialLinks(int $teamMemberId, array $socialLinks): void
    {
        if ($teamMemberId <= 0) {
            return;
        }

        $normalized = self::normalizeSocialLinks($socialLinks);

        if (self::socialLinksTableExist()) {
            $pdo = self::getConnection();
            $pdo->beginTransaction();
            try {
                $deleteStmt = $pdo->prepare('DELETE FROM team_social_links WHERE team_member_id = :id');
                $deleteStmt->execute(['id' => $teamMemberId]);

                $insertStmt = $pdo->prepare(
                    'INSERT INTO team_social_links (team_member_id, platform_name, url, sort_order, created_at, updated_at)
                     VALUES (:team_member_id, :platform_name, :url, :sort_order, :created_at, :updated_at)'
                );

                $timestamp = now();
                $order = 1;
                foreach ($normalized as $platform => $url) {
                    $insertStmt->execute([
                        'team_member_id' => $teamMemberId,
                        'platform_name' => $platform,
                        'url' => $url,
                        'sort_order' => $order++,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                }

                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
        }

        self::syncSocialLinksColumn($teamMemberId, $normalized);
    }

    private static function attachSocialLinks(array $member): array
    {
        $memberId = (int) ($member['id'] ?? $member['_id'] ?? 0);
        $member['social_links'] = self::getSocialLinks($memberId);
        return $member;
    }

    private static function attachSocialLinksToCollection(array $members): array
    {
        if (empty($members)) {
            return $members;
        }

        if (!self::socialLinksTableExist()) {
            foreach ($members as $index => $member) {
                $members[$index]['social_links'] = self::normalizeSocialLinks($member['social_links'] ?? []);
            }
            return $members;
        }

        $memberIds = array_values(array_filter(array_map(
            fn($member) => (int) ($member['id'] ?? $member['_id'] ?? 0),
            $members
        ), fn($id) => $id > 0));

        if (empty($memberIds)) {
            foreach ($members as $index => $member) {
                $members[$index]['social_links'] = [];
            }
            return $members;
        }

        $placeholders = implode(', ', array_fill(0, count($memberIds), '?'));
        $sql = sprintf(
            'SELECT team_member_id, platform_name, url FROM team_social_links WHERE team_member_id IN (%s) ORDER BY sort_order ASC, id ASC',
            $placeholders
        );
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($memberIds);
        $rows = $stmt->fetchAll() ?: [];

        $linksByMember = [];
        foreach ($rows as $row) {
            $memberId = (int) ($row['team_member_id'] ?? 0);
            $platform = sanitize_string($row['platform_name'] ?? '');
            $url = sanitize_string($row['url'] ?? '');
            if ($memberId <= 0 || $platform === '' || $url === '' || $url === '#') {
                continue;
            }
            if (!array_key_exists($memberId, $linksByMember)) {
                $linksByMember[$memberId] = [];
            }
            $linksByMember[$memberId][$platform] = $url;
        }

        foreach ($members as $index => $member) {
            $memberId = (int) ($member['id'] ?? $member['_id'] ?? 0);
            $members[$index]['social_links'] = $linksByMember[$memberId] ?? [];
        }

        return $members;
    }

    public static function list(bool $includeInactive = false): array
    {
        $where = '';
        if (!$includeInactive) {
            $where = '(is_active = 1 OR is_active IS NULL)';
        }
        $rows = self::fetchAll($where, [], 'CASE WHEN sort_order IS NULL OR sort_order <= 0 THEN 1 ELSE 0 END, sort_order ASC, created_at ASC, id ASC');
        return self::attachSocialLinksToCollection($rows);
    }

    public static function findById($id): ?array
    {
        $row = parent::findById($id);
        return $row ? self::attachSocialLinks($row) : null;
    }

    public static function findBySlug(string $slug, bool $includeInactive = false): ?array
    {
        $where = 'slug = :slug';
        $params = ['slug' => $slug];
        if (!$includeInactive) {
            $where .= ' AND (is_active = 1 OR is_active IS NULL)';
        }
        $sql = sprintf('SELECT * FROM %s WHERE %s LIMIT 1', static::$table, $where);
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return self::attachSocialLinks(static::decodeRow($row));
    }

    public static function toggleActive(int $id): ?array
    {
        $current = self::findById($id);
        if (!$current) {
            return null;
        }
        $next = (int) !((bool) $current['is_active']);
        return self::update($id, ['is_active' => $next]);
    }
}
