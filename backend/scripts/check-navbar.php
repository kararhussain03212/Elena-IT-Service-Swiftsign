<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $stmt = $pdo->query('SHOW DATABASES');
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "DATABASES:\n";
    print_r($dbs);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
