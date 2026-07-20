<?php
require_once __DIR__ . '/../models/ProgramApplicationModel.php';
require_once __DIR__ . '/../models/CareerProgramModel.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/email.php';
require_once __DIR__ . '/../utils/recaptcha.php';

class ProgramApplicationController
{
    private static array $allowedStatuses = ['new', 'reviewed', 'accepted', 'rejected'];

    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];

        $fullName = sanitize_string($body['fullName'] ?? '');
        $email = sanitize_string($body['email'] ?? '');
        $contactNumber = sanitize_string($body['contactNumber'] ?? '');
        $programId = parse_integer($body['programId'] ?? 0, 0);

        if ($fullName === '' || $email === '' || $contactNumber === '' || $programId <= 0) {
            error_response(400, 'Full name, email, contact number and program are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response(400, 'A valid email is required.');
        }
        if (!array_key_exists('hasBasicItKnowledge', $body) || $body['hasBasicItKnowledge'] === '' || $body['hasBasicItKnowledge'] === null) {
            error_response(400, 'Please indicate whether you have basic IT/Programming knowledge.');
        }
        if (!verify_recaptcha((string) ($body['recaptchaToken'] ?? ''))) {
            error_response(400, 'reCAPTCHA verification failed. Please try again.');
        }
        $program = CareerProgramModel::findById($programId);
        if (!$program) {
            error_response(400, 'Selected program does not exist.');
        }

        $payload = [
            'program_id' => $programId,
            'full_name' => $fullName,
            'email' => $email,
            'contact_number' => $contactNumber,
            'has_basic_it_knowledge' => parse_boolean($body['hasBasicItKnowledge'], false) ? 1 : 0,
            'status' => 'new',
        ];

        $created = DataInserter::insert('program_applications', $payload);
        send_program_application_email($created, $program['title'] ?? null);

        return [
            'status' => 201,
            'data' => [
                'message' => 'Thank you! Your application has been received.',
                'application' => $created,
            ],
        ];
    }

    public static function list(array $context): array
    {
        $query = $context['query'] ?? [];
        $page = max(1, parse_integer($query['page'] ?? 1, 1));
        $limit = max(1, parse_integer($query['limit'] ?? 20, 20));
        $status = sanitize_string($query['status'] ?? '');
        $programIdRaw = $query['programId'] ?? '';
        $programId = $programIdRaw !== '' ? parse_integer($programIdRaw, 0) : null;

        $result = ProgramApplicationModel::paginate($page, $limit, $programId, $status);
        $total = (int) ($result['total'] ?? 0);
        $pages = max(1, (int) ceil($total / $limit));

        return [
            'items' => $result['items'] ?? [],
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => $pages,
        ];
    }

    public static function updateStatus(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $body = $context['body'] ?? [];
        $status = sanitize_string($body['status'] ?? '');
        if (!in_array($status, self::$allowedStatuses, true)) {
            error_response(400, 'Invalid status. Must be one of: ' . implode(', ', self::$allowedStatuses));
        }
        $updated = ProgramApplicationModel::update($id, ['status' => $status]);
        if (!$updated) {
            error_response(404, 'Application not found.');
        }
        return ['status' => 200, 'data' => $updated];
    }
}
