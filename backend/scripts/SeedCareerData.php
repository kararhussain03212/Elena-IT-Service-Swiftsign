<?php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = Database::connection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $existing = (int) $pdo->query('SELECT COUNT(*) FROM career_programs')->fetchColumn();
    if ($existing > 0) {
        echo "career_programs already has data ({$existing} rows) — skipping program seed.\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO career_programs
            (status_badge, join_badge, title, description, duration, prerequisite, who_can_apply, why_choose, is_active, sort_order, created_at, updated_at)
            VALUES (:status_badge, :join_badge, :title, :description, :duration, :prerequisite, :who_can_apply, :why_choose, 1, 1, :created_at, :updated_at)");

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');

        $stmt->execute([
            'status_badge' => 'Applications Open',
            'join_badge' => 'Join Swift Sign IT',
            'title' => 'Cybersecurity & IT Associates Program',
            'description' => 'Kickstart your technical career with our intensive learning pathway. We bridge the gap between academic knowledge and real-world business demands through structured mentorship.',
            'duration' => '3-Month Program',
            'prerequisite' => 'Basic IT & Networking',
            'who_can_apply' => json_encode([
                'Undergraduates & Graduates',
                'Computer Science & IT Students',
                'Aspiring Security Professionals',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'why_choose' => json_encode([
                'Industry-aligned Curriculum',
                'Hands-on Sandbox Environment',
                'Placement Assistance & Referrals',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $programId = (int) $pdo->lastInsertId();
        echo "Seeded career_programs row (id={$programId}).\n";

        $modules = [
            ['num' => 1, 'title' => 'IT Infrastructure & Support', 'desc' => 'Master hardware, operating systems (Windows/Linux hardening), network protocols, and troubleshooting workflows.'],
            ['num' => 2, 'title' => 'Full-Stack Web Technologies', 'desc' => 'Build modern, responsive web architectures using HTML, CSS, JavaScript, and advanced framework concepts.'],
            ['num' => 3, 'title' => 'Cybersecurity Fundamentals', 'desc' => 'Learn network security, encryption standards, PKI infrastructure, and vulnerability assessment methodologies.'],
            ['num' => 4, 'title' => 'App Development & UI/UX', 'desc' => 'Design elegant user interfaces and implement robust application logic using modern software design patterns.'],
            ['num' => 5, 'title' => 'Security Operations & GRC', 'desc' => 'Understand Security Operations Center (SOC) flows, log monitoring, and Governance, Risk & Compliance standards.'],
            ['num' => 6, 'title' => 'Capstone & Real-World Lab', 'desc' => 'Collaborate in teams on cross-functional business projects, staging environments, and production deployments.'],
        ];

        $moduleStmt = $pdo->prepare("INSERT INTO career_program_modules
            (program_id, module_number, title, description, sort_order, created_at, updated_at)
            VALUES (:program_id, :module_number, :title, :description, :sort_order, :created_at, :updated_at)");

        foreach ($modules as $module) {
            $moduleStmt->execute([
                'program_id' => $programId,
                'module_number' => $module['num'],
                'title' => $module['title'],
                'description' => $module['desc'],
                'sort_order' => $module['num'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
        echo "Seeded " . count($modules) . " career_program_modules rows.\n";
    }

    $contentExists = (int) $pdo->query('SELECT COUNT(*) FROM career_page_content WHERE id = 1')->fetchColumn();
    if ($contentExists > 0) {
        echo "career_page_content already seeded — skipping.\n";
    } else {
        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        $stmt = $pdo->prepare("INSERT INTO career_page_content
            (id, hero_title, breadcrumb_label, apply_form_heading, apply_form_description, apply_form_prereq_question,
             join_team_heading, join_team_paragraph1, join_team_paragraph2,
             general_interest_heading, general_interest_description,
             cv_email, cv_email_subject, linkedin_url, cv_button_text, linkedin_button_text,
             newsletter_heading, newsletter_description, created_at, updated_at)
            VALUES (1, :hero_title, :breadcrumb_label, :apply_form_heading, :apply_form_description, :apply_form_prereq_question,
             :join_team_heading, :join_team_paragraph1, :join_team_paragraph2,
             :general_interest_heading, :general_interest_description,
             :cv_email, :cv_email_subject, :linkedin_url, :cv_button_text, :linkedin_button_text,
             :newsletter_heading, :newsletter_description, :created_at, :updated_at)");

        $stmt->execute([
            'hero_title' => 'Careers & Internships',
            'breadcrumb_label' => 'Careers',
            'apply_form_heading' => 'Apply Online',
            'apply_form_description' => 'Submit your application to reserve a slot. Our admissions committee will review your profile within 48 hours.',
            'apply_form_prereq_question' => 'Do you have basic IT/Programming knowledge?',
            'join_team_heading' => 'Join Our Team',
            'join_team_paragraph1' => 'Looking for a full-time career? We are always on the lookout for passion-driven cybersecurity analysts, systems engineers, full-stack developers, and technology consultants who want to make an impact.',
            'join_team_paragraph2' => "Even if we don't have an active opening matching your profile, drop your credentials to get pre-evaluated for future roles in our global tech hubs.",
            'general_interest_heading' => 'General Interest Application',
            'general_interest_description' => 'Send your credentials directly to our HR team.',
            'cv_email' => 'info@it.swiftsignbm.com',
            'cv_email_subject' => 'Job Application',
            'linkedin_url' => 'https://www.linkedin.com/company/swift-sign-it-cyber-solutions/',
            'cv_button_text' => 'Email Resume (CV)',
            'linkedin_button_text' => 'LinkedIn Profile',
            'newsletter_heading' => 'Stay updated with Swift Sign IT',
            'newsletter_description' => 'Subscribe to receive program launch alerts, cyber insights, and internship announcements.',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        echo "Seeded career_page_content singleton row.\n";
    }

    echo "Career data seed completed successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
