<?php
require_once __DIR__ . '/../models/ContactMessageModel.php';
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../utils/email.php';

class ContactMessageController
{
    public static function create(array $context): array
    {
        require_data_inserter();
        $body = $context['body'] ?? [];
        $name = sanitize_string($body['name'] ?? '');
        $email = sanitize_string($body['email'] ?? '');
        $message = sanitize_string($body['message'] ?? '');
        $subject = sanitize_string($body['subject'] ?? 'Website Contact Form');
        $phone = sanitize_string($body['phone'] ?? '');

        if ($name === '' || $email === '' || $message === '') {
            error_response(400, 'Name, email and message are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response(400, 'A valid email is required.');
        }

        $payload = [
            'name' => $name,
            'email' => $email,
            'subject' => $subject,
            'phone' => $phone,
            'message' => $message,
            'ip_address' => sanitize_string($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''),
            'user_agent' => sanitize_string($_SERVER['HTTP_USER_AGENT'] ?? ''),
            'is_read' => 0,
        ];

        $messageDoc = DataInserter::insert('contact_messages', $payload);
        $skipServerEmail = parse_boolean($body['skipServerEmail'] ?? '', false);
        $clientMarkedSent = parse_boolean($body['emailSentByClient'] ?? '', false);
        $clientEmailError = sanitize_string($body['emailErrorByClient'] ?? '');

        if ($skipServerEmail) {
            $emailResult = [
                'sent' => $clientMarkedSent,
                'reason' => $clientMarkedSent ? '' : ($clientEmailError !== '' ? $clientEmailError : 'Client-side mailer skipped or failed.'),
            ];
        } else {
            $emailResult = send_contact_message_email($messageDoc);
        }

        $update = ['email_sent' => $emailResult['sent'] ? 1 : 0];
        if (!empty($emailResult['reason'])) {
            $update['email_error'] = $emailResult['reason'];
        }
        if (!empty($emailResult['sent'])) {
            $update['emailed_at'] = now();
        }
        ContactMessageModel::update((int) $messageDoc['id'], $update);

        $mustDeliver = parse_boolean(env('CONTACT_REQUIRE_EMAIL_DELIVERY', '0'), false);
        if ($mustDeliver && empty($emailResult['sent'])) {
            error_response(502, 'Message saved, but email delivery failed. Please try again shortly.');
        }

        return [
            'status' => 201,
            'data' => [
                'message' => $emailResult['sent']
                    ? 'Thank you! Your message has been sent.'
                    : 'Thank you! Your message has been received.',
                'saved' => true,
                'emailed' => (bool) $emailResult['sent'],
            ],
        ];
    }

    public static function list(array $context): array
    {
        $query = $context['query'] ?? [];
        $page = max(1, parse_integer($query['page'] ?? 1, 1));
        $limit = max(1, parse_integer($query['limit'] ?? 20, 20));
        $search = sanitize_string($query['search'] ?? '');
        $readParam = $query['read'] ?? null;
        $read = null;
        if ($readParam !== null && $readParam !== '') {
            $read = parse_boolean($readParam, false);
        }
        $result = ContactMessageModel::paginate($page, $limit, $search, $read);
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

    public static function toggleRead(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        $message = ContactMessageModel::findById($id);
        if (!$message) {
            error_response(404, 'Contact message not found.');
        }
        $nextRead = isset($context['body']['isRead'])
            ? (parse_boolean($context['body']['isRead']) ? 1 : 0)
            : ((int) !((bool) ($message['is_read'] ?? 0)));
        $updates = [
            'is_read' => $nextRead,
            'read_at' => $nextRead ? now() : null,
        ];
        $updated = ContactMessageModel::update($id, $updates);
        return $updated;
    }

    public static function delete(array $context): array
    {
        $id = (int) ($context['params']['id'] ?? 0);
        ContactMessageModel::delete($id);
        return ['message' => 'Deleted'];
    }
}
