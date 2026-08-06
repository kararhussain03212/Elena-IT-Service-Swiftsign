<?php
require_once __DIR__ . '/../models/Certification.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/recaptcha.php';

class CertController
{
    private static function hasUploadedCertImage(): bool
    {
        return !empty($_FILES['image']) && (int) ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;
    }

    private static function decodeJsonListField(array $body, string $key): array
    {
        $value = $body[$key] ?? [];
        if (is_string($value)) {
            $decoded = $value === '' ? [] : json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return is_array($value) ? $value : [];
    }

    private static function resolveCertImage(array $body = []): ?string
    {
        $uploadKeys = ['image'];

        foreach ($uploadKeys as $key) {
            if (!empty($_FILES[$key])) {
                $errorCode = (int) ($_FILES[$key]['error'] ?? UPLOAD_ERR_NO_FILE);
                if ($errorCode !== UPLOAD_ERR_OK) {
                    continue;
                }

                $upload = handle_file_upload($key);
                if ($upload) {
                    return $upload['url'] ?? ('/' . ltrim((string) ($upload['path'] ?? ''), '/'));
                }
            }
        }

        foreach ($uploadKeys as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }

            $normalizedPath = normalize_upload_path((string) $body[$key]);
            if ($normalizedPath !== '') {
                return $normalizedPath;
            }
            return null;
        }

        return null;
    }

    public static function getCertifications(array $context): array
    {
        $certs = Certification::getAll();
        return [
            'status' => 200,
            'data' => $certs
        ];
    }

    public static function getCertification(array $context): array
    {
        $code = sanitize_string($context['params']['id'] ?? '');
        $cert = Certification::getByCode($code);

        if ($cert === null) {
            error_response(404, "Certification with code '{$code}' not found.");
        }

        return [
            'status' => 200,
            'data' => $cert
        ];
    }

    public static function getCertificationById(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $cert = Certification::findById($id);

        if ($cert === null) {
            error_response(404, "Certification with ID '{$id}' not found.");
        }

        return [
            'status' => 200,
            'data' => $cert
        ];
    }

    public static function create(array $context): array
    {
        $body = $context['body'] ?? [];
        $code = sanitize_string($body['code'] ?? '');
        $title = sanitize_string($body['title'] ?? '');
        if ($code === '') {
            error_response(400, 'Code is required.', ['field' => 'code']);
        }
        if ($title === '') {
            error_response(400, 'Title is required.', ['field' => 'title']);
        }

        $payload = [
            'code' => $code,
            'title' => $title,
            'fullName' => sanitize_string($body['fullName'] ?? ''),
            'isOpen' => parse_boolean($body['isOpen'] ?? '', false) ? 1 : 0,
            'tagline' => sanitize_string($body['tagline'] ?? ''),
            'duration' => sanitize_string($body['duration'] ?? ''),
            'dates' => sanitize_string($body['dates'] ?? ''),
            'mode' => sanitize_string($body['mode'] ?? ''),
            'prerequisite' => sanitize_string($body['prerequisite'] ?? ''),
            'aboutText' => $body['aboutText'] ?? '',
            'audience' => self::decodeJsonListField($body, 'audience'),
            'modules' => self::decodeJsonListField($body, 'modules'),
            'benefits' => self::decodeJsonListField($body, 'benefits'),
            'outcome' => $body['outcome'] ?? '',
            'fees' => self::decodeJsonListField($body, 'fees'),
            'feeFootnote' => $body['feeFootnote'] ?? '',
            'applicationLink' => sanitize_string($body['applicationLink'] ?? ''),
            'qrCodeUrl' => sanitize_string($body['qrCodeUrl'] ?? ''),
            'footerCta' => sanitize_string($body['footerCta'] ?? ''),
            'applyTitle' => sanitize_string($body['applyTitle'] ?? ''),
            'applyDescription' => $body['applyDescription'] ?? ''
        ];

        $image = self::resolveCertImage($body);
        if ($image !== null) {
            $payload['image'] = $image;
        }

        $success = Certification::create($payload);
        if ($success) {
            $certs = Certification::getAll();
            $created = end($certs);
            return [
                'status' => 201,
                'data' => $created
            ];
        }

        error_response(500, "Failed to create certification.");
        return [];
    }

    public static function update(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = Certification::findById($id);
        if (!$existing) {
            error_response(404, "Certification not found.");
        }
        $body = $context['body'] ?? [];

        $payload = [];
        $fields = [
            'code', 'title', 'fullName', 'isOpen', 'tagline', 'duration',
            'dates', 'mode', 'prerequisite', 'aboutText', 'audience',
            'modules', 'benefits', 'outcome', 'fees', 'feeFootnote',
            'applicationLink', 'qrCodeUrl', 'footerCta', 'applyTitle', 'applyDescription'
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $body)) {
                if ($field === 'isOpen') {
                    $payload['isOpen'] = parse_boolean($body['isOpen'], false) ? 1 : 0;
                } elseif (in_array($field, ['audience', 'modules', 'benefits', 'fees'], true)) {
                    $payload[$field] = is_string($body[$field]) ? json_decode($body[$field], true) : $body[$field];
                } else {
                    $payload[$field] = $body[$field];
                }
            }
        }

        $hasNewUpload = self::hasUploadedCertImage();
        $image = self::resolveCertImage($body);
        if ($image !== null) {
            $payload['image'] = $image;
        }

        $updated = Certification::update($id, $payload);
        if (!$updated) {
            error_response(404, "Certification not found.");
        }
        if ($hasNewUpload) {
            delete_uploaded_file_if_present($existing['image'] ?? null);
        }

        return [
            'status' => 200,
            'data' => $updated
        ];
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $existing = Certification::findById($id);
        if (!$existing) {
            error_response(404, "Certification not found.");
        }
        Certification::delete($id);
        delete_uploaded_file_if_present($existing['image'] ?? null);
        return [
            'status' => 200,
            'message' => 'Deleted'
        ];
    }

    public static function registerInterest(array $context): array
    {
        $body = $context['body'] ?? [];

        // Validate basic fields
        $required = ['name', 'email', 'phone', 'certCode'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                error_response(400, "Field '{$field}' is required.");
            }
        }
        if (!verify_recaptcha((string) ($body['recaptchaToken'] ?? ''))) {
            error_response(400, 'reCAPTCHA verification failed. Please try again.');
        }

        $saved = Certification::saveRegistration($body);

        if ($saved) {
            return [
                'status' => 200,
                'message' => 'Registration saved successfully.'
            ];
        } else {
            error_response(500, 'Failed to save registration details.');
        }
        return [];
    }
}
