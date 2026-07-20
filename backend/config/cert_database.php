<?php

class CertDatabase
{
    private static ?MongoDB\Driver\Manager $manager = null;
    private static bool $useFallback = false;
    private static string $dbName = 'swift_sign_db';
    private static string $fallbackDir = __DIR__ . '/../data';

    public static function init(): void
    {
        // Create fallback directory if it doesn't exist
        if (!is_dir(self::$fallbackDir)) {
            mkdir(self::$fallbackDir, 0777, true);
        }

        // Check if MongoDB extension is loaded
        if (!class_exists('MongoDB\Driver\Manager')) {
            self::$useFallback = true;
            return;
        }

        try {
            // Setup connection with a 2-second timeout so it doesn't hang if MongoDB is down
            self::$manager = new MongoDB\Driver\Manager(
                'mongodb://localhost:27017',
                ['connectTimeoutMS' => 2000]
            );

            // Force connection check by sending a ping command
            $command = new MongoDB\Driver\Command(['ping' => 1]);
            self::$manager->executeCommand('admin', $command);
        } catch (\Exception $e) {
            self::$manager = null;
            self::$useFallback = true;
        }
    }

    public static function isFallback(): bool
    {
        if (self::$manager === null && !self::$useFallback) {
            self::init();
        }
        return self::$useFallback;
    }

    private static function getManager(): ?MongoDB\Driver\Manager
    {
        if (self::$manager === null && !self::$useFallback) {
            self::init();
        }
        return self::$manager;
    }

    /**
     * Find documents matching query
     */
    public static function find(string $collection, array $filter = []): array
    {
        if (self::isFallback()) {
            return self::fallbackRead($collection, $filter);
        }

        try {
            $query = new MongoDB\Driver\Query($filter);
            $cursor = self::getManager()->executeQuery(self::$dbName . '.' . $collection, $query);
            $results = [];
            foreach ($cursor as $doc) {
                // Convert BSON document to associative array
                $results[] = json_decode(json_encode($doc), true);
            }
            return $results;
        } catch (\Exception $e) {
            // Fallback if query fails
            return self::fallbackRead($collection, $filter);
        }
    }

    /**
     * Find single document matching query
     */
    public static function findOne(string $collection, array $filter = []): ?array
    {
        $results = self::find($collection, $filter);
        return !empty($results) ? $results[0] : null;
    }

    /**
     * Insert a document
     */
    public static function insert(string $collection, array $document): bool
    {
        // Add unique ID if not present
        if (!isset($document['_id'])) {
            $document['_id'] = self::generateUUID();
        }

        if (self::isFallback()) {
            return self::fallbackWrite($collection, $document);
        }

        try {
            $bulk = new MongoDB\Driver\BulkWrite();
            $bulk->insert($document);
            $result = self::getManager()->executeBulkWrite(self::$dbName . '.' . $collection, $bulk);
            return $result->getInsertedCount() > 0;
        } catch (\Exception $e) {
            // Fallback write if MongoDB is down
            return self::fallbackWrite($collection, $document);
        }
    }

    /**
     * Helper to generate simple random UUID/ID
     */
    private static function generateUUID(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Read from local JSON files
     */
    private static function fallbackRead(string $collection, array $filter = []): array
    {
        $filePath = self::$fallbackDir . '/' . $collection . '.json';
        if (!file_exists($filePath)) {
            return [];
        }

        $data = json_decode(file_get_contents($filePath), true);
        if (!is_array($data)) {
            return [];
        }

        // Apply basic filtering if needed
        if (!empty($filter)) {
            $data = array_filter($data, function ($item) use ($filter) {
                foreach ($filter as $key => $value) {
                    if (!isset($item[$key])) {
                        return false;
                    }
                    if (is_array($value)) {
                        // Support very basic operators if needed, or exact match
                        return false;
                    }
                    if (strtolower($item[$key]) !== strtolower($value)) {
                        return false;
                    }
                }
                return true;
            });
            return array_values($data);
        }

        return $data;
    }

    /**
     * Write to local JSON files
     */
    private static function fallbackWrite(string $collection, array $document): bool
    {
        $filePath = self::$fallbackDir . '/' . $collection . '.json';
        $data = [];
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (!is_array($data)) {
                $data = [];
            }
        }

        // If it's the certifications collection and we are seeding, check duplicates
        if ($collection === 'certifications') {
            foreach ($data as $item) {
                if (isset($item['code']) && isset($document['code']) && strtolower($item['code']) === strtolower($document['code'])) {
                    return true; // Already exists
                }
            }
        }

        $data[] = $document;
        return file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT)) !== false;
    }
}
