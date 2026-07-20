<?php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/CareerProgramModuleModel.php';

class CareerProgramModel extends BaseModel
{
    protected static string $table = 'career_programs';
    protected static array $jsonColumns = ['who_can_apply', 'why_choose'];

    public static function listActiveWithModules(): array
    {
        $programs = self::fetchAll('is_active = 1', [], 'sort_order ASC, id ASC');
        foreach ($programs as &$program) {
            $program['modules'] = CareerProgramModuleModel::listForProgram((int) $program['id']);
        }
        return $programs;
    }

    public static function listAllWithModules(): array
    {
        $programs = self::fetchAll('', [], 'sort_order ASC, id ASC');
        foreach ($programs as &$program) {
            $program['modules'] = CareerProgramModuleModel::listForProgram((int) $program['id']);
        }
        return $programs;
    }

    public static function findWithModules(int $id): ?array
    {
        $program = self::findById($id);
        if (!$program) {
            return null;
        }
        $program['modules'] = CareerProgramModuleModel::listForProgram($id);
        return $program;
    }
}
