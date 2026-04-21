<?php
require_once __DIR__ . '/env.php';

class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            $host = env('MYSQL_HOST', env('DB_HOST', '127.0.0.1'));
            $port = env('MYSQL_PORT', env('DB_PORT', '3306'));
            $database = env('MYSQL_DATABASE', env('DB_NAME', 'swiftsignit'));
            $username = env('MYSQL_USER', env('DB_USER', 'root'));
            $password = env('MYSQL_PASSWORD', env('DB_PASS', ''));
            $charset = env('MYSQL_CHARSET', env('DB_CHARSET', 'utf8mb4'));

            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $database, $charset);
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            self::$instance = new PDO($dsn, $username, $password, $options);
        }

        return self::$instance;
    }
}
