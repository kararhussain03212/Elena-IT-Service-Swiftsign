<?php
require_once __DIR__ . '/BaseModel.php';

class CareerProgramModuleModel extends BaseModel
{
    protected static string $table = 'career_program_modules';

    public static function listForProgram(int $programId): array
    {
        return self::fetchAll('program_id = :program_id', ['program_id' => $programId], 'sort_order ASC, module_number ASC, id ASC');
    }

    public static function nextModuleNumber(int $programId): int
    {
        $sql = 'SELECT COALESCE(MAX(module_number), 0) FROM career_program_modules WHERE program_id = :program_id';
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(['program_id' => $programId]);
        return ((int) $stmt->fetchColumn()) + 1;
    }
}
