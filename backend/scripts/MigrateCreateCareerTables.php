<?php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = Database::connection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS career_programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      status_badge VARCHAR(120) DEFAULT NULL,
      join_badge VARCHAR(120) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      duration VARCHAR(120) DEFAULT NULL,
      prerequisite VARCHAR(255) DEFAULT NULL,
      who_can_apply JSON DEFAULT NULL,
      why_choose JSON DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'career_programs' checked/created.\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS career_program_modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      program_id INT NOT NULL,
      module_number INT NOT NULL DEFAULT 0,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      CONSTRAINT fk_career_program_modules_program
        FOREIGN KEY (program_id) REFERENCES career_programs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'career_program_modules' checked/created.\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS career_page_content (
      id INT PRIMARY KEY DEFAULT 1,
      hero_title VARCHAR(255) NOT NULL,
      breadcrumb_label VARCHAR(120) NOT NULL,
      apply_form_heading VARCHAR(255) DEFAULT NULL,
      apply_form_description TEXT DEFAULT NULL,
      apply_form_prereq_question VARCHAR(255) DEFAULT NULL,
      join_team_heading VARCHAR(255) DEFAULT NULL,
      join_team_paragraph1 TEXT DEFAULT NULL,
      join_team_paragraph2 TEXT DEFAULT NULL,
      general_interest_heading VARCHAR(255) DEFAULT NULL,
      general_interest_description TEXT DEFAULT NULL,
      cv_email VARCHAR(255) DEFAULT NULL,
      cv_email_subject VARCHAR(255) DEFAULT NULL,
      linkedin_url VARCHAR(1024) DEFAULT NULL,
      cv_button_text VARCHAR(120) DEFAULT NULL,
      linkedin_button_text VARCHAR(120) DEFAULT NULL,
      newsletter_heading VARCHAR(255) DEFAULT NULL,
      newsletter_description TEXT DEFAULT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      CONSTRAINT chk_career_page_content_singleton CHECK (id = 1)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'career_page_content' checked/created.\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS program_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      program_id INT DEFAULT NULL,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(180) NOT NULL,
      contact_number VARCHAR(60) NOT NULL,
      has_basic_it_knowledge TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      CONSTRAINT fk_program_applications_program
        FOREIGN KEY (program_id) REFERENCES career_programs(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'program_applications' checked/created.\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(180) NOT NULL UNIQUE,
      source_page VARCHAR(120) DEFAULT NULL,
      subscribed_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'newsletter_subscribers' checked/created.\n";

    echo "Career tables migration completed successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
