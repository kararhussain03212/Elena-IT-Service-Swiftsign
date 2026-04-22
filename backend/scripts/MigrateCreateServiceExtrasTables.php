<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

function read_seed_extras(string $path): array
{
    if (!file_exists($path)) {
        return ['benefits' => [], 'faqs' => []];
    }
    $raw = file_get_contents($path);
    $decoded = json_decode($raw ?: '[]', true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return ['benefits' => [], 'faqs' => []];
    }
    return $decoded;
}

function table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
    );
    $stmt->execute(['table' => $table]);
    return (bool) $stmt->fetchColumn();
}

function ensure_table(PDO $pdo, string $table, string $sql): void
{
    if (table_exists($pdo, $table)) {
        return;
    }
    $pdo->exec($sql);
}

function has_rows(PDO $pdo, string $table, int $serviceId): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE service_id = :id");
    $stmt->execute(['id' => $serviceId]);
    return ((int) $stmt->fetchColumn()) > 0;
}

$pdo = Database::connection();

ensure_table(
    $pdo,
    'service_benefits',
    <<<SQL
CREATE TABLE service_benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_service_benefits_service_id (service_id),
  CONSTRAINT fk_service_benefits_service_id
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

ensure_table(
    $pdo,
    'service_faqs',
    <<<SQL
CREATE TABLE service_faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_service_faqs_service_id (service_id),
  CONSTRAINT fk_service_faqs_service_id
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

// Seed defaults from seed-json (only when a service has no rows yet).
$seedPath = __DIR__ . '/seed-json/service-extras.json';
$seed = read_seed_extras($seedPath);

$defaultBenefits = array_values(array_filter(array_map(
    fn($v) => sanitize_string($v ?? ''),
    $seed['benefits'] ?? []
), fn($v) => $v !== ''));

$defaultFaqs = [];
foreach (($seed['faqs'] ?? []) as $faq) {
    if (!is_array($faq)) {
        continue;
    }
    $question = sanitize_string($faq['question'] ?? '');
    $answer = sanitize_string($faq['answer'] ?? '');
    if ($question === '' && $answer === '') {
        continue;
    }
    $defaultFaqs[] = ['question' => $question, 'answer' => $answer];
}

$serviceIds = $pdo->query('SELECT id FROM services')->fetchAll(PDO::FETCH_COLUMN) ?: [];
$timestamp = now();

$benefitInserted = 0;
$faqInserted = 0;

foreach ($serviceIds as $serviceId) {
    $serviceId = (int) $serviceId;
    if ($serviceId <= 0) continue;

    if (!has_rows($pdo, 'service_benefits', $serviceId)) {
        $stmt = $pdo->prepare(
            'INSERT INTO service_benefits (service_id, label, sort_order, created_at, updated_at)
             VALUES (:service_id, :label, :sort_order, :created_at, :updated_at)'
        );
        foreach ($defaultBenefits as $index => $label) {
            $stmt->execute([
                'service_id' => $serviceId,
                'label' => $label,
                'sort_order' => $index + 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
            $benefitInserted++;
        }
    }

    if (!has_rows($pdo, 'service_faqs', $serviceId)) {
        $stmt = $pdo->prepare(
            'INSERT INTO service_faqs (service_id, question, answer, sort_order, created_at, updated_at)
             VALUES (:service_id, :question, :answer, :sort_order, :created_at, :updated_at)'
        );
        foreach ($defaultFaqs as $index => $faq) {
            $stmt->execute([
                'service_id' => $serviceId,
                'question' => $faq['question'],
                'answer' => $faq['answer'],
                'sort_order' => $index + 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
            $faqInserted++;
        }
    }
}

echo "Migration complete.\n";
echo "Seeded benefits rows: {$benefitInserted}\n";
echo "Seeded faq rows: {$faqInserted}\n";
