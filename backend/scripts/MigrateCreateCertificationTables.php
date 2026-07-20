<?php
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = Database::connection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. certifications table
    $pdo->exec("CREATE TABLE IF NOT EXISTS certifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(120) NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      isOpen TINYINT(1) NOT NULL DEFAULT 0,
      tagline VARCHAR(500) NOT NULL,
      duration VARCHAR(120) NOT NULL,
      dates VARCHAR(120) DEFAULT NULL,
      mode VARCHAR(120) DEFAULT NULL,
      prerequisite VARCHAR(255) DEFAULT NULL,
      aboutText TEXT DEFAULT NULL,
      audience JSON DEFAULT NULL,
      modules JSON DEFAULT NULL,
      benefits JSON DEFAULT NULL,
      outcome TEXT DEFAULT NULL,
      fees JSON DEFAULT NULL,
      feeFootnote TEXT DEFAULT NULL,
      applicationLink VARCHAR(1024) DEFAULT NULL,
      qrCodeUrl VARCHAR(1024) DEFAULT NULL,
      footerCta VARCHAR(500) DEFAULT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'certifications' checked/created.\n";

    // 2. registrations table
    $pdo->exec("CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      completedPrior VARCHAR(10) DEFAULT 'No',
      certCode VARCHAR(50) NOT NULL,
      registeredAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'registrations' checked/created.\n";

    echo "Certification tables migration completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
