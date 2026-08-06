<?php
require_once __DIR__ . '/env.php';

class Database
{
    /** @var PDO|null */
    private static $instance = null;

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

            // Without STRICT_TRANS_TABLES, MySQL silently truncates values that
            // exceed a column's length instead of raising an error — e.g. a title
            // over 255 chars gets cut to 255 with the API still reporting 201
            // success. Enforcing strict mode turns that into a catchable
            // PDOException (surfaced as a 500 by the global handler) instead of
            // quietly losing data with no error at all.
            self::$instance->exec("SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',STRICT_TRANS_TABLES')");
        }

        return self::$instance;
    }
}
