<?php
require_once __DIR__ . '/BaseModel.php';

class ServiceModel extends BaseModel
{
    protected static string $table = 'services';
    protected static array $imageColumns = ['image', 'image1', 'detail_image'];

    private static ?bool $extrasTablesReady = null;
    private static ?bool $extrasColumnsReady = null;

    private static function extrasTablesExist(): bool
    {
        if (self::$extrasTablesReady !== null) {
            return self::$extrasTablesReady;
        }

        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare(
                'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
            );

            $stmt->execute(['table' => 'service_benefits']);
            $hasBenefits = (bool) $stmt->fetchColumn();

            $stmt->execute(['table' => 'service_faqs']);
            $hasFaqs = (bool) $stmt->fetchColumn();

            self::$extrasTablesReady = $hasBenefits && $hasFaqs;
        } catch (Throwable $e) {
            self::$extrasTablesReady = false;
        }

        return self::$extrasTablesReady;
    }

    private static function extrasColumnsExist(): bool
    {
        if (self::$extrasColumnsReady !== null) {
            return self::$extrasColumnsReady;
        }

        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare(
                'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
            );

            $stmt->execute(['table' => 'services', 'column' => 'benefits']);
            $hasBenefits = (bool) $stmt->fetchColumn();

            $stmt->execute(['table' => 'services', 'column' => 'faqs']);
            $hasFaqs = (bool) $stmt->fetchColumn();

            self::$extrasColumnsReady = $hasBenefits && $hasFaqs;
        } catch (Throwable $e) {
            self::$extrasColumnsReady = false;
        }

        return self::$extrasColumnsReady;
    }

    public static function shouldUseExtrasTables(): bool
    {
        return self::extrasTablesExist();
    }

    public static function shouldUseExtrasColumns(): bool
    {
        return self::extrasColumnsExist();
    }

    public static function getBenefits(int $serviceId): array
    {
        if (!self::extrasTablesExist()) {
            return [];
        }
        $stmt = self::getConnection()->prepare(
            'SELECT label FROM service_benefits WHERE service_id = :id ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute(['id' => $serviceId]);
        return array_values(array_map(fn($row) => (string) ($row['label'] ?? ''), $stmt->fetchAll() ?: []));
    }

    public static function replaceBenefits(int $serviceId, array $benefits): void
    {
        if (!self::extrasTablesExist()) {
            return;
        }

        $pdo = self::getConnection();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM service_benefits WHERE service_id = :id');
            $stmt->execute(['id' => $serviceId]);

            $stmt = $pdo->prepare(
                'INSERT INTO service_benefits (service_id, label, sort_order, created_at, updated_at)
                 VALUES (:service_id, :label, :sort_order, :created_at, :updated_at)'
            );

            $timestamp = now();
            $order = 1;
            foreach ($benefits as $benefit) {
                $label = sanitize_string($benefit ?? '');
                if ($label === '') continue;
                $stmt->execute([
                    'service_id' => $serviceId,
                    'label' => $label,
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

    public static function getFaqs(int $serviceId): array
    {
        if (!self::extrasTablesExist()) {
            return [];
        }
        $stmt = self::getConnection()->prepare(
            'SELECT id, question, answer FROM service_faqs WHERE service_id = :id ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute(['id' => $serviceId]);
        $rows = $stmt->fetchAll() ?: [];
        return array_values(array_map(fn($row) => [
            'id' => (int) ($row['id'] ?? 0),
            'question' => (string) ($row['question'] ?? ''),
            'answer' => (string) ($row['answer'] ?? ''),
        ], $rows));
    }

    public static function replaceFaqs(int $serviceId, array $faqs): void
    {
        if (!self::extrasTablesExist()) {
            return;
        }

        $pdo = self::getConnection();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM service_faqs WHERE service_id = :id');
            $stmt->execute(['id' => $serviceId]);

            $stmt = $pdo->prepare(
                'INSERT INTO service_faqs (service_id, question, answer, sort_order, created_at, updated_at)
                 VALUES (:service_id, :question, :answer, :sort_order, :created_at, :updated_at)'
            );

            $timestamp = now();
            $order = 1;
            foreach ($faqs as $faq) {
                if (!is_array($faq)) continue;
                $question = sanitize_string($faq['question'] ?? '');
                $answer = sanitize_string($faq['answer'] ?? '');
                if ($question === '' && $answer === '') continue;

                $stmt->execute([
                    'service_id' => $serviceId,
                    'question' => $question,
                    'answer' => $answer,
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

    public static function attachExtras(array $service): array
    {
        $id = (int) ($service['id'] ?? $service['_id'] ?? 0);
        if ($id <= 0) {
            return $service;
        }

        if (self::extrasTablesExist()) {
            $service['benefits'] = self::getBenefits($id);
            $service['faqs'] = self::getFaqs($id);
            return $service;
        }

        if (self::extrasColumnsExist()) {
            $benefitsRaw = $service['benefits'] ?? [];
            $faqsRaw = $service['faqs'] ?? [];
            $service['benefits'] = ensure_array($benefitsRaw);
            $service['faqs'] = ensure_array($faqsRaw);
            return $service;
        }

        return $service;
    }

    public static function list(bool $includeInactive = false): array
    {
        $where = '';
        if (!$includeInactive) {
            $where = '(is_active = 1 OR is_active IS NULL)';
        }
        return self::fetchAll($where, [], 'CASE WHEN sort_order IS NULL OR sort_order <= 0 THEN 1 ELSE 0 END, sort_order ASC, created_at ASC, id ASC');
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
        return $row ? static::decodeRow($row) : null;
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
