<?php
require_once __DIR__ . '/../models/CareerPageContentModel.php';
require_once __DIR__ . '/../utils/helpers.php';

class CareerPageContentController
{
    private static array $fieldMap = [
        'heroTitle' => 'hero_title',
        'breadcrumbLabel' => 'breadcrumb_label',
        'applyFormHeading' => 'apply_form_heading',
        'applyFormDescription' => 'apply_form_description',
        'applyFormPrereqQuestion' => 'apply_form_prereq_question',
        'joinTeamHeading' => 'join_team_heading',
        'joinTeamParagraph1' => 'join_team_paragraph1',
        'joinTeamParagraph2' => 'join_team_paragraph2',
        'generalInterestHeading' => 'general_interest_heading',
        'generalInterestDescription' => 'general_interest_description',
        'cvEmail' => 'cv_email',
        'cvEmailSubject' => 'cv_email_subject',
        'linkedinUrl' => 'linkedin_url',
        'cvButtonText' => 'cv_button_text',
        'linkedinButtonText' => 'linkedin_button_text',
        'newsletterHeading' => 'newsletter_heading',
        'newsletterDescription' => 'newsletter_description',
    ];

    public static function get(array $context): array
    {
        $content = CareerPageContentModel::get();
        if (!$content) {
            error_response(404, 'Career page content not found.');
        }
        return ['status' => 200, 'data' => $content];
    }

    public static function update(array $context): array
    {
        $body = $context['body'] ?? [];
        $payload = [];
        foreach (self::$fieldMap as $incomingKey => $column) {
            if (array_key_exists($incomingKey, $body)) {
                $payload[$column] = deep_trim_strings((string) $body[$incomingKey]);
            }
        }
        if (empty($payload)) {
            error_response(400, 'No valid fields provided.');
        }
        $updated = CareerPageContentModel::save($payload);
        return ['status' => 200, 'data' => $updated];
    }
}
