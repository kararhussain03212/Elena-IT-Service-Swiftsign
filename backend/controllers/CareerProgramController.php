<?php
require_once __DIR__ . '/../models/CareerProgramModel.php';
require_once __DIR__ . '/../models/CareerProgramModuleModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class CareerProgramController
{
    public static function listPublic(array $context): array
    {
        return ['status' => 200, 'data' => CareerProgramModel::listActiveWithModules()];
    }

    public static function listAdmin(array $context): array
    {
        return ['status' => 200, 'data' => CareerProgramModel::listAllWithModules()];
    }

    public static function getOne(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $program = CareerProgramModel::findWithModules($id);
        if (!$program) {
            error_response(404, 'Career program not found.');
        }
        return ['status' => 200, 'data' => $program];
    }

    private static function buildPayload(array $body): array
    {
        $payload = [];
        if (array_key_exists('statusBadge', $body)) $payload['status_badge'] = sanitize_string($body['statusBadge']);
        if (array_key_exists('joinBadge', $body)) $payload['join_badge'] = sanitize_string($body['joinBadge']);
        if (array_key_exists('title', $body)) $payload['title'] = sanitize_string($body['title']);
        if (array_key_exists('description', $body)) $payload['description'] = deep_trim_strings((string) $body['description']);
        if (array_key_exists('duration', $body)) $payload['duration'] = sanitize_string($body['duration']);
        if (array_key_exists('prerequisite', $body)) $payload['prerequisite'] = sanitize_string($body['prerequisite']);
        if (array_key_exists('whoCanApply', $body)) {
            $list = is_string($body['whoCanApply']) ? json_decode($body['whoCanApply'], true) : $body['whoCanApply'];
            $payload['who_can_apply'] = deep_trim_strings(is_array($list) ? array_values($list) : []);
        }
        if (array_key_exists('whyChoose', $body)) {
            $list = is_string($body['whyChoose']) ? json_decode($body['whyChoose'], true) : $body['whyChoose'];
            $payload['why_choose'] = deep_trim_strings(is_array($list) ? array_values($list) : []);
        }
        if (array_key_exists('isActive', $body)) $payload['is_active'] = parse_boolean($body['isActive'], true) ? 1 : 0;
        if (array_key_exists('order', $body)) $payload['sort_order'] = parse_integer($body['order'], 0);
        return $payload;
    }

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $payload = self::buildPayload($body);
        $payload['title'] = $payload['title'] ?? sanitize_string($body['title'] ?? '');
        if ($payload['title'] === '') {
            error_response(400, 'Program title is required.');
        }
        $created = DataInserter::insert('career_programs', $payload, ['who_can_apply', 'why_choose']);
        return ['status' => 201, 'data' => CareerProgramModel::findWithModules((int) $created['id'])];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $payload = self::buildPayload($body);
        $updated = CareerProgramModel::update($id, $payload);
        if (!$updated) {
            error_response(404, 'Career program not found.');
        }
        return ['status' => 200, 'data' => CareerProgramModel::findWithModules($id)];
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        CareerProgramModel::delete($id);
        return ['status' => 200, 'message' => 'Deleted'];
    }

    // ---- Modules sub-resource ----

    public static function addModule(array $context): array
    {
        require_data_inserter();
        $programId = (int) ($context['params']['id'] ?? 0);
        if (!CareerProgramModel::findById($programId)) {
            error_response(404, 'Career program not found.');
        }
        $body = $context['body'] ?? [];
        $title = sanitize_string($body['title'] ?? '');
        if ($title === '') {
            error_response(400, 'Module title is required.');
        }
        $payload = [
            'program_id' => $programId,
            'module_number' => parse_integer($body['moduleNumber'] ?? 0, 0) ?: CareerProgramModuleModel::nextModuleNumber($programId),
            'title' => $title,
            'description' => deep_trim_strings((string) ($body['description'] ?? '')),
            'sort_order' => parse_integer($body['order'] ?? 0, 0) ?: CareerProgramModuleModel::nextModuleNumber($programId),
        ];
        $created = DataInserter::insert('career_program_modules', $payload);
        return ['status' => 201, 'data' => $created];
    }

    public static function updateModule(array $context): array
    {
        $programId = (int) ($context['params']['id'] ?? 0);
        $moduleId = (int) ($context['params']['moduleId'] ?? 0);
        $module = CareerProgramModuleModel::findById($moduleId);
        if (!$module || (int) ($module['program_id'] ?? 0) !== $programId) {
            error_response(404, 'Module not found.');
        }
        $body = $context['body'] ?? [];
        $payload = [];
        if (array_key_exists('title', $body)) $payload['title'] = sanitize_string($body['title']);
        if (array_key_exists('description', $body)) $payload['description'] = deep_trim_strings((string) $body['description']);
        if (array_key_exists('moduleNumber', $body)) $payload['module_number'] = parse_integer($body['moduleNumber'], 0);
        if (array_key_exists('order', $body)) $payload['sort_order'] = parse_integer($body['order'], 0);

        $updated = CareerProgramModuleModel::update($moduleId, $payload);
        if (!$updated) {
            error_response(404, 'Module not found.');
        }
        return ['status' => 200, 'data' => $updated];
    }

    public static function deleteModule(array $context): array
    {
        $programId = (int) ($context['params']['id'] ?? 0);
        $moduleId = (int) ($context['params']['moduleId'] ?? 0);
        $module = CareerProgramModuleModel::findById($moduleId);
        if (!$module || (int) ($module['program_id'] ?? 0) !== $programId) {
            error_response(404, 'Module not found.');
        }
        CareerProgramModuleModel::delete($moduleId);
        return ['status' => 200, 'message' => 'Deleted'];
    }

    public static function reorderModules(array $context): array
    {
        $programId = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $order = is_array($body['moduleIds'] ?? null) ? $body['moduleIds'] : [];
        // Only ever reorder modules that actually belong to this program — a
        // stray/foreign moduleId in the payload is silently ignored rather
        // than allowed to reorder a module under the wrong program.
        $ownedIds = array_column(CareerProgramModuleModel::listForProgram($programId), 'id');
        $index = 0;
        foreach ($order as $moduleId) {
            if (!in_array((int) $moduleId, $ownedIds, true)) {
                continue;
            }
            CareerProgramModuleModel::update((int) $moduleId, ['sort_order' => $index + 1]);
            $index++;
        }
        return ['status' => 200, 'data' => CareerProgramModuleModel::listForProgram($programId)];
    }
}
