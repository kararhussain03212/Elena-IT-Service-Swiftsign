<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../models/ServiceModel.php';
require_once __DIR__ . '/../models/ProjectModel.php';
require_once __DIR__ . '/../models/BlogModel.php';
require_once __DIR__ . '/../models/SliderModel.php';
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../models/TestimonialModel.php';
require_once __DIR__ . '/../models/SectionContentModel.php';
require_once __DIR__ . '/DataInserter.php';

class SeedFromScripts
{
    private PDO $pdo;
    private ?bool $serviceExtrasTablesReady = null;
    private ?bool $serviceExtrasColumnsReady = null;

    public function __construct()
    {
        $this->pdo = Database::connection();
    }

    private function readJson(string $relativePath): array
    {
        $path = __DIR__ . '/' . ltrim($relativePath, '/');
        if (!file_exists($path)) {
            throw new RuntimeException("Seed file not found: {$path}");
        }
        $raw = file_get_contents($path);
        $data = json_decode($raw ?: '[]', true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException("Invalid JSON in {$path}");
        }
        return is_array($data) ? $data : [];
    }

    private function findId(string $table, string $column, $value): ?int
    {
        $sql = sprintf('SELECT id FROM %s WHERE %s = :value LIMIT 1', $table, $column);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['value' => $value]);
        $id = $stmt->fetchColumn();
        return $id ? (int) $id : null;
    }

    private function updateRow(string $table, int $id, array $data, array $jsonColumns = []): void
    {
        if (empty($data)) {
            return;
        }
        $data['updated_at'] = now();
        $set = [];
        $params = ['id' => $id];
        foreach ($data as $column => $value) {
            $set[] = sprintf('%s = :%s', $column, $column);
            if (in_array($column, $jsonColumns, true) && is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
            $params[$column] = $value;
        }
        $sql = sprintf('UPDATE %s SET %s WHERE id = :id', $table, implode(', ', $set));
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }

    private function upsert(string $table, string $uniqueColumn, $uniqueValue, array $data, array $jsonColumns = []): void
    {
        $id = $this->findId($table, $uniqueColumn, $uniqueValue);
        if ($id) {
            $this->updateRow($table, $id, $data, $jsonColumns);
            return;
        }
        DataInserter::insert($table, $data, $jsonColumns);
    }

    private function serviceExtrasTablesExist(): bool
    {
        if ($this->serviceExtrasTablesReady !== null) {
            return $this->serviceExtrasTablesReady;
        }

        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table LIMIT 1'
        );

        $stmt->execute(['table' => 'service_benefits']);
        $hasBenefits = (bool) $stmt->fetchColumn();

        $stmt->execute(['table' => 'service_faqs']);
        $hasFaqs = (bool) $stmt->fetchColumn();

        $this->serviceExtrasTablesReady = $hasBenefits && $hasFaqs;
        return $this->serviceExtrasTablesReady;
    }

    private function serviceExtrasColumnsExist(): bool
    {
        if ($this->serviceExtrasColumnsReady !== null) {
            return $this->serviceExtrasColumnsReady;
        }

        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1'
        );

        $stmt->execute(['table' => 'services', 'column' => 'benefits']);
        $hasBenefits = (bool) $stmt->fetchColumn();

        $stmt->execute(['table' => 'services', 'column' => 'faqs']);
        $hasFaqs = (bool) $stmt->fetchColumn();

        $this->serviceExtrasColumnsReady = $hasBenefits && $hasFaqs;
        return $this->serviceExtrasColumnsReady;
    }

    private function serviceHasExtrasRows(string $table, int $serviceId): bool
    {
        $stmt = $this->pdo->prepare(sprintf('SELECT COUNT(*) FROM %s WHERE service_id = :id', $table));
        $stmt->execute(['id' => $serviceId]);
        return ((int) $stmt->fetchColumn()) > 0;
    }

    private function decodeJsonColumn($value): array
    {
        if ($value === null || $value === '') {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        $decoded = json_decode((string) $value, true);
        return json_last_error() === JSON_ERROR_NONE && is_array($decoded) ? $decoded : [];
    }

    private function seedServiceExtras(array $defaults): void
    {
        if (!$this->serviceExtrasTablesExist()) {
            echo "Skipping service extras seed (tables not migrated yet).\n";
            return;
        }

        $defaultBenefits = array_values(array_filter(array_map(
            fn($v) => sanitize_string($v ?? ''),
            $defaults['benefits'] ?? []
        ), fn($v) => $v !== ''));

        $defaultFaqs = [];
        foreach (($defaults['faqs'] ?? []) as $faq) {
            if (!is_array($faq)) continue;
            $question = sanitize_string($faq['question'] ?? '');
            $answer = sanitize_string($faq['answer'] ?? '');
            if ($question === '' && $answer === '') continue;
            $defaultFaqs[] = ['question' => $question, 'answer' => $answer];
        }

        $supportsLegacyColumns = $this->serviceExtrasColumnsExist();
        $services = $this->pdo->query('SELECT id' . ($supportsLegacyColumns ? ', benefits, faqs' : '') . ' FROM services')
            ->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $insertedBenefits = 0;
        $insertedFaqs = 0;

        $benefitStmt = $this->pdo->prepare(
            'INSERT INTO service_benefits (service_id, label, sort_order, created_at, updated_at)
             VALUES (:service_id, :label, :sort_order, :created_at, :updated_at)'
        );
        $faqStmt = $this->pdo->prepare(
            'INSERT INTO service_faqs (service_id, question, answer, sort_order, created_at, updated_at)
             VALUES (:service_id, :question, :answer, :sort_order, :created_at, :updated_at)'
        );

        foreach ($services as $service) {
            $serviceId = (int) ($service['id'] ?? 0);
            if ($serviceId <= 0) continue;

            $timestamp = now();

            if (!$this->serviceHasExtrasRows('service_benefits', $serviceId)) {
                $benefits = $defaultBenefits;
                if ($supportsLegacyColumns) {
                    $legacy = $this->decodeJsonColumn($service['benefits'] ?? null);
                    $legacy = array_values(array_filter(array_map(fn($v) => sanitize_string($v ?? ''), $legacy), fn($v) => $v !== ''));
                    if (!empty($legacy)) {
                        $benefits = $legacy;
                    }
                }

                $order = 1;
                foreach ($benefits as $label) {
                    $benefitStmt->execute([
                        'service_id' => $serviceId,
                        'label' => $label,
                        'sort_order' => $order++,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                    $insertedBenefits++;
                }
            }

            if (!$this->serviceHasExtrasRows('service_faqs', $serviceId)) {
                $faqs = $defaultFaqs;
                if ($supportsLegacyColumns) {
                    $legacy = $this->decodeJsonColumn($service['faqs'] ?? null);
                    $normalized = [];
                    foreach ($legacy as $faq) {
                        if (!is_array($faq)) continue;
                        $question = sanitize_string($faq['question'] ?? '');
                        $answer = sanitize_string($faq['answer'] ?? '');
                        if ($question === '' && $answer === '') continue;
                        $normalized[] = ['question' => $question, 'answer' => $answer];
                    }
                    if (!empty($normalized)) {
                        $faqs = $normalized;
                    }
                }

                $order = 1;
                foreach ($faqs as $faq) {
                    $faqStmt->execute([
                        'service_id' => $serviceId,
                        'question' => $faq['question'],
                        'answer' => $faq['answer'],
                        'sort_order' => $order++,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                    $insertedFaqs++;
                }
            }
        }

        echo "Service extras seed completed.\n";
        echo "Inserted benefits rows: {$insertedBenefits}\n";
        echo "Inserted faq rows: {$insertedFaqs}\n";
    }

    private function seedServices(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'title' => sanitize_string($item['title'] ?? ''),
                'slug' => sanitize_string($item['slug'] ?? ''),
                'short_description' => sanitize_string($item['shortDescription'] ?? ''),
                'description' => sanitize_string($item['description'] ?? ''),
                'description1' => sanitize_string($item['description1'] ?? ''),
                'description2' => sanitize_string($item['description2'] ?? ''),
                'icon' => sanitize_string($item['icon'] ?? ''),
                'image' => sanitize_string($item['image'] ?? ''),
                'image1' => sanitize_string($item['image1'] ?? ''),
                'detail_image' => sanitize_string($item['detailImage'] ?? ''),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['slug'] === '') {
                continue;
            }
            $this->upsert('services', 'slug', $payload['slug'], $payload);
        }
    }

    private function seedProjects(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'title' => sanitize_string($item['title'] ?? ''),
                'slug' => sanitize_string($item['slug'] ?? ''),
                'category' => sanitize_string($item['category'] ?? ''),
                'status' => sanitize_string($item['status'] ?? ''),
                'tech' => sanitize_string($item['tech'] ?? ''),
                'year' => sanitize_string($item['year'] ?? ''),
                'duration' => sanitize_string($item['duration'] ?? ''),
                'client' => sanitize_string($item['client'] ?? ''),
                'location' => sanitize_string($item['location'] ?? ''),
                'url' => sanitize_string($item['url'] ?? ''),
                'overview' => $item['overview'] ?? '',
                'challenge' => $item['challenge'] ?? '',
                'cover_image' => sanitize_string($item['coverImage'] ?? ''),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
                'tags' => $item['tags'] ?? [],
            ];
            if ($payload['slug'] === '') {
                continue;
            }
            $this->upsert('projects', 'slug', $payload['slug'], $payload, ['tags']);
        }
    }

    private function seedBlogs(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'title' => sanitize_string($item['title'] ?? ''),
                'slug' => sanitize_string($item['slug'] ?? ''),
                'excerpt' => $item['excerpt'] ?? '',
                'content' => $item['content'] ?? '',
                'cover_image' => sanitize_string($item['coverImage'] ?? ''),
                'author' => sanitize_string($item['author'] ?? 'Admin'),
                'read_time' => sanitize_string($item['readTime'] ?? ''),
                'category' => sanitize_string($item['category'] ?? ''),
                'published' => parse_boolean($item['published'] ?? false, false) ? 1 : 0,
                'tags' => $item['tags'] ?? [],
            ];
            if ($payload['slug'] === '') {
                continue;
            }
            $this->upsert('blogs', 'slug', $payload['slug'], $payload, ['tags']);
        }
    }

    private function seedSliders(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'heading' => sanitize_string($item['heading'] ?? ''),
                'title' => sanitize_string($item['title'] ?? ''),
                'subtitle' => sanitize_string($item['subtitle'] ?? ''),
                'button_text' => sanitize_string($item['buttonText'] ?? ''),
                'button_link' => sanitize_string($item['buttonLink'] ?? ''),
                'image' => sanitize_string($item['image'] ?? ''),
                'video' => sanitize_string($item['video'] ?? ''),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['title'] === '') {
                continue;
            }
            $this->upsert('sliders', 'title', $payload['title'], $payload);
        }
    }

    private function seedTeam(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'name' => sanitize_string($item['name'] ?? ''),
                'slug' => sanitize_string($item['slug'] ?? ''),
                'role' => sanitize_string($item['role'] ?? ''),
                'bio' => sanitize_string($item['bio'] ?? ''),
                'image' => sanitize_string($item['image'] ?? ''),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'skills' => $item['skills'] ?? [],
                'education' => $item['education'] ?? [],
                'social_links' => $item['socialLinks'] ?? [],
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['slug'] === '') {
                continue;
            }
            $this->upsert('team_members', 'slug', $payload['slug'], $payload, ['skills', 'education', 'social_links']);
        }
    }

    private function seedTestimonials(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'name' => sanitize_string($item['name'] ?? ''),
                'role' => sanitize_string($item['role'] ?? ''),
                'company' => sanitize_string($item['company'] ?? ''),
                'message' => sanitize_string($item['message'] ?? ''),
                'avatar' => sanitize_string($item['avatar'] ?? ''),
                'rating' => parse_integer($item['rating'] ?? 5, 5),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['name'] === '') {
                continue;
            }
            $this->upsert('testimonials', 'name', $payload['name'], $payload);
        }
    }

    private function seedSections(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'page' => sanitize_string($item['page'] ?? ''),
                'key_name' => sanitize_string($item['key'] ?? ''),
                'content' => $item['content'] ?? [],
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['key_name'] === '') {
                continue;
            }
            $this->upsert('section_contents', 'key_name', $payload['key_name'], $payload, ['content']);
        }
    }

    private function seedSubServices(array $items): void
    {
        foreach ($items as $item) {
            $payload = [
                'title' => sanitize_string($item['title'] ?? ''),
                'description' => sanitize_string($item['description'] ?? ''),
                'icon' => sanitize_string($item['icon'] ?? ''),
                'sort_order' => parse_integer($item['order'] ?? 0, 0),
                'is_active' => parse_boolean($item['isActive'] ?? true, true) ? 1 : 0,
            ];
            if ($payload['title'] === '') {
                continue;
            }
            $this->upsert('sub_services', 'title', $payload['title'], $payload);
        }
    }

    public function run(): void
    {
        $base = 'seed-json';
        $services = $this->readJson("$base/services.json");
        $serviceExtras = $this->readJson("$base/service-extras.json");
        $projects = array_merge(
            $this->readJson("$base/projects.json"),
            $this->readJson("$base/projects-extra.json")
        );
        $blogs = $this->readJson("$base/blogs.json");
        $sliders = $this->readJson("$base/sliders.json");
        $team = $this->readJson("$base/team.json");
        $testimonials = $this->readJson("$base/testimonials.json");
        $sections = $this->readJson("$base/sections.json");
        $subServices = $this->readJson("$base/sub-services.json");

        $this->seedServices($services);
        $this->seedServiceExtras($serviceExtras);
        $this->seedProjects($projects);
        $this->seedBlogs($blogs);
        $this->seedSliders($sliders);
        $this->seedTeam($team);
        $this->seedTestimonials($testimonials);
        $this->seedSections($sections);
        $this->seedSubServices($subServices);
    }
}

$runner = new SeedFromScripts();
$runner->run();
echo "Seed completed.\n";
