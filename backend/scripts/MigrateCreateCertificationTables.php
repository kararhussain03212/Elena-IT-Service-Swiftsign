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
      applyTitle VARCHAR(120) DEFAULT NULL,
      applyDescription TEXT DEFAULT NULL,
      image VARCHAR(1024) DEFAULT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Table 'certifications' checked/created.\n";

    // Add columns if migrating an existing table
    $existingColumns = $pdo->query("SHOW COLUMNS FROM certifications")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('applyTitle', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE certifications ADD COLUMN applyTitle VARCHAR(120) DEFAULT NULL AFTER footerCta");
        echo "Column 'applyTitle' added.\n";
    }
    if (!in_array('applyDescription', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE certifications ADD COLUMN applyDescription TEXT DEFAULT NULL AFTER applyTitle");
        echo "Column 'applyDescription' added.\n";
    }
    if (!in_array('image', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE certifications ADD COLUMN image VARCHAR(1024) DEFAULT NULL AFTER applyDescription");
        echo "Column 'image' added.\n";
    }

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
