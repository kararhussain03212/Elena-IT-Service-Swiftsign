<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/DataInserter.php';

$payload = [
    'page' => 'about',
    'key_name' => 'about.whoWeAre',
    'content' => [
        'badge' => 'WHO WE ARE',
        'heading' => 'Connecting, Solving, and Empowering the Future of Technology',
        'description' => 'At Elena IT Services, we combine creativity, technology, and strategy to build digital products that make an impact. Our team specializes in crafting innovative solutions, from responsive web applications and intelligent AI tools to complete enterprise systems. We build success by connecting, solving, and empowering.',
        'highlights' => [
            'Technology Consultancy',
            'We Provide best services',
            'Maintenance And Support',
            'Requirements Gathering',
        ],
        'mainImage' => '/uploads/about-two-image1.jpg',
        'smallImage' => '/uploads/about-two-image2.png',
    ],
    'sort_order' => 2,
    'is_active' => 1,
];

$pdo = Database::connection();
$stmt = $pdo->prepare('SELECT id FROM section_contents WHERE key_name = :key LIMIT 1');
$stmt->execute(['key' => $payload['key_name']]);
$id = (int) ($stmt->fetchColumn() ?: 0);

if ($id > 0) {
    $update = $pdo->prepare(
        'UPDATE section_contents
         SET page = :page,
             content = :content,
             sort_order = :sort_order,
             is_active = :is_active,
             updated_at = :updated_at
         WHERE id = :id'
    );

    $update->execute([
        'id' => $id,
        'page' => $payload['page'],
        'content' => json_encode($payload['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'sort_order' => $payload['sort_order'],
        'is_active' => $payload['is_active'],
        'updated_at' => now(),
    ]);

    echo "Updated section: {$payload['key_name']} (ID: {$id})\n";
    exit(0);
}

$created = DataInserter::insert('section_contents', $payload, ['content']);
echo 'Inserted section: ' . ($created['key_name'] ?? $payload['key_name']) . ' (ID: ' . ($created['id'] ?? 'n/a') . ")\n";
