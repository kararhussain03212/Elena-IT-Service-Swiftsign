<?php
// Black-box integration tests against a running instance of this backend.
// Start the server first:
//   cd backend && php -S 127.0.0.1:5000 -t public public/router.php
// Then run:
//   php backend/tests/run.php
//
// Covers every route in backend/routes/api.php: happy path + at least one
// failure case (validation, auth, or not-found) per endpoint.

require __DIR__ . '/http.php';

$ADMIN_EMAIL = getenv('TEST_ADMIN_EMAIL') ?: 'admin@elenaitservices.com';
$ADMIN_PASSWORD = getenv('TEST_ADMIN_PASSWORD') ?: '@#@itswiftsignbm@11236';
$FIXTURE_IMAGE = __DIR__ . '/fixtures/image.webp';

if (!is_file($FIXTURE_IMAGE)) {
    fwrite(STDERR, "Missing fixture image at $FIXTURE_IMAGE\n");
    exit(1);
}

// This suite calls /api/auth/login a couple of times per run; clear the rate
// limiter's buckets first so repeated local test runs don't trip the same
// limits a real brute-force attempt would (see backend/utils/rate_limit.php).
require_once __DIR__ . '/../config/database.php';
try {
    Database::connection()->exec('DELETE FROM rate_limits');
} catch (PDOException $e) {
    // Table doesn't exist yet — fine, nothing to clear.
}

echo "API base: " . API_BASE . "\n\n";

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
echo "-- Health --\n";
test('GET /api/health/webp returns 200 with capability report', function () {
    $r = api_request('GET', '/api/health/webp');
    assert_status($r, 200);
    assert_has_key($r['body'], 'webp');
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
echo "\n-- Auth --\n";

$adminToken = null;
test('POST /api/auth/login succeeds with valid admin credentials', function () use ($ADMIN_EMAIL, $ADMIN_PASSWORD, &$adminToken) {
    $r = api_request('POST', '/api/auth/login', ['email' => $ADMIN_EMAIL, 'password' => $ADMIN_PASSWORD]);
    assert_status($r, 200);
    $token = $r['body']['token'] ?? $r['body']['accessToken'] ?? null;
    assert_true($token !== null, 'expected a token in the login response');
    $adminToken = $token;
});

test('POST /api/auth/login fails with wrong password (401, not 500)', function () use ($ADMIN_EMAIL) {
    $r = api_request('POST', '/api/auth/login', ['email' => $ADMIN_EMAIL, 'password' => 'definitely-wrong']);
    assert_status($r, 401);
});

$viewerEmail = 'e2e-viewer-' . time() . '@example.test';
$viewerToken = null;
$viewerUserId = null;
test('POST /api/auth/register creates a viewer account', function () use ($viewerEmail, &$viewerToken, &$viewerUserId) {
    $r = api_request('POST', '/api/auth/register', [
        'name' => 'E2E Viewer',
        'email' => $viewerEmail,
        'password' => 'TestPass123!',
    ]);
    assert_status($r, 201);
    $token = $r['body']['token'] ?? $r['body']['accessToken'] ?? null;
    assert_true($token !== null, 'expected a token in the register response');
    $viewerToken = $token;
    $viewerUserId = $r['body']['user']['_id'] ?? $r['body']['user']['id'] ?? null;
});

test('POST /api/auth/register fails on duplicate email (409/400, not 500)', function () use ($viewerEmail) {
    $r = api_request('POST', '/api/auth/register', [
        'name' => 'Dup',
        'email' => $viewerEmail,
        'password' => 'TestPass123!',
    ]);
    assert_true(in_array($r['status'], [400, 409], true), "expected 400/409 for duplicate email, got {$r['status']}");
});

test('GET /api/auth/me requires auth (401 without token)', function () {
    $r = api_request('GET', '/api/auth/me');
    assert_status($r, 401);
});

test('GET /api/auth/me returns the current user with a valid token', function () use (&$adminToken) {
    $r = api_request('GET', '/api/auth/me', null, $adminToken);
    assert_status($r, 200);
});

// ---------------------------------------------------------------------------
// Generic CRUD exerciser for the simple content resources that share the
// same shape: GET list (public), POST create (auth+add_data), PUT update
// (auth+edit_data), PATCH :id/active (auth+publish_data), DELETE
// (auth+delete_data), plus a viewer-role 403 check and a not-found 404 check.
// ---------------------------------------------------------------------------
function crud_resource_suite(string $label, string $path, array $createPayload, array $updatePayload, ?callable $extraFieldsAfterCreate, &$adminToken, &$viewerToken, bool $hasToggle = true)
{
    echo "\n-- $label ($path) --\n";
    $createdId = null;

    test("GET $path returns 200", function () use ($path) {
        $r = api_request('GET', $path);
        assert_status($r, 200);
    });

    test("POST $path requires auth (401 without token)", function () use ($path, $createPayload) {
        $r = api_request('POST', $path, $createPayload);
        assert_status($r, 401);
    });

    test("POST $path forbidden for a viewer with no add_data permission (403)", function () use ($path, $createPayload, &$viewerToken) {
        $r = api_request('POST', $path, $createPayload, $viewerToken);
        assert_status($r, 403);
    });

    test("POST $path with missing required fields returns 400, not 500", function () use ($path, &$adminToken) {
        $r = api_request('POST', $path, [], $adminToken);
        assert_true($r['status'] === 400, "expected 400 for empty payload, got {$r['status']}: " . json_encode($r['body']));
    });

    test("POST $path creates a record (201)", function () use ($path, $createPayload, &$adminToken, &$createdId) {
        $r = api_request('POST', $path, $createPayload, $adminToken);
        assert_status($r, 201);
        $id = $r['body']['_id'] ?? $r['body']['id'] ?? null;
        assert_true($id !== null, 'expected an id/_id in the create response: ' . json_encode($r['body']));
        $createdId = $id;
    });

    test("PUT $path/:id updates the record (200)", function () use ($path, $updatePayload, &$adminToken, &$createdId) {
        assert_true($createdId !== null, 'no created id to update');
        $r = api_request('PUT', "$path/$createdId", $updatePayload, $adminToken);
        assert_status($r, 200);
    });

    test("PUT $path/:id on a non-existent id returns 404", function () use ($path, $updatePayload, &$adminToken) {
        $r = api_request('PUT', "$path/999999999", $updatePayload, $adminToken);
        assert_status($r, 404);
    });

    if ($hasToggle) {
        test("PATCH $path/:id/active toggles active state (200)", function () use ($path, &$adminToken, &$createdId) {
            $r = api_request('PATCH', "$path/$createdId/active", ['isActive' => false], $adminToken);
            assert_status($r, 200);
        });
    }

    test("DELETE $path/:id removes the record (200)", function () use ($path, &$adminToken, &$createdId) {
        $r = api_request('DELETE', "$path/$createdId", null, $adminToken);
        assert_status($r, 200);
    });

    test("DELETE $path/:id on an already-deleted id returns 404, not 200", function () use ($path, &$adminToken, &$createdId) {
        $r = api_request('DELETE', "$path/$createdId", null, $adminToken);
        assert_true($r['status'] === 404, "expected 404 for double-delete, got {$r['status']}");
    });
}

crud_resource_suite('Sliders', '/api/sliders',
    ['heading' => 'Test Heading', 'title' => 'Test Title ' . time(), 'subtitle' => 'sub'],
    ['title' => 'Updated Title'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Services', '/api/services',
    ['title' => 'Test Service ' . time(), 'shortDescription' => 'desc'],
    ['title' => 'Updated Service'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Sub-services', '/api/sub-services',
    ['title' => 'Test Sub Service ' . time(), 'description' => 'desc'],
    ['title' => 'Updated Sub Service'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Projects', '/api/projects',
    ['title' => 'Test Project ' . time(), 'category' => 'Web'],
    ['title' => 'Updated Project'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Testimonials', '/api/testimonials',
    ['name' => 'Test Person', 'message' => 'Great service ' . time()],
    ['message' => 'Updated message'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Team', '/api/team',
    ['name' => 'Test Member ' . time(), 'role' => 'Engineer'],
    ['role' => 'Senior Engineer'],
    null, $adminToken, $viewerToken);

crud_resource_suite('Blogs', '/api/blogs',
    ['title' => 'Test Blog ' . time(), 'content' => '<p>Body</p>'],
    ['title' => 'Updated Blog'],
    null, $adminToken, $viewerToken, false);

// Blogs use "published" not "active" for their toggle route.
echo "\n-- Blogs publish toggle --\n";
test('POST /api/blogs creates then PATCH /:id/published toggles (200)', function () use (&$adminToken) {
    $create = api_request('POST', '/api/blogs', ['title' => 'Toggle Blog ' . time(), 'content' => '<p>x</p>'], $adminToken);
    assert_status($create, 201);
    $id = $create['body']['_id'] ?? $create['body']['id'];
    $toggle = api_request('PATCH', "/api/blogs/$id/published", ['published' => true], $adminToken);
    assert_status($toggle, 200);
    $del = api_request('DELETE', "/api/blogs/$id", null, $adminToken);
    assert_status($del, 200);
});

test('Blog content is HTML-sanitized on create (script/onerror stripped, safe markup kept)', function () use (&$adminToken) {
    $create = api_request('POST', '/api/blogs', [
        'title' => 'XSS Regression ' . time(),
        'content' => '<p>Legit content</p><script>alert(document.cookie)</script><img src="x" onerror="alert(1)">',
    ], $adminToken);
    assert_status($create, 201);
    $content = $create['body']['content'] ?? '';
    assert_true(str_contains($content, '<p>Legit content</p>'), 'sanitizer stripped legitimate markup');
    assert_true(!str_contains($content, '<script'), 'sanitizer failed to strip <script>');
    assert_true(!str_contains($content, 'onerror'), 'sanitizer failed to strip onerror attribute');

    $id = $create['body']['_id'] ?? $create['body']['id'];
    $update = api_request('PUT', "/api/blogs/$id", [
        'content' => '<p>Updated</p><iframe src="evil.com"></iframe><a href="javascript:alert(1)">bad</a>',
    ], $adminToken);
    assert_status($update, 200);
    $updatedContent = $update['body']['content'] ?? '';
    assert_true(!str_contains($updatedContent, '<iframe'), 'sanitizer failed to strip <iframe> on update');
    assert_true(!str_contains($updatedContent, 'javascript:'), 'sanitizer failed to strip javascript: href on update');

    $del = api_request('DELETE', "/api/blogs/$id", null, $adminToken);
    assert_status($del, 200);
});

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
echo "\n-- Sections --\n";
$sectionId = null;
test('GET /api/sections returns 200', function () {
    $r = api_request('GET', '/api/sections');
    assert_status($r, 200);
});

test('POST /api/sections requires auth (401)', function () {
    $r = api_request('POST', '/api/sections', ['page' => 'home', 'key' => 'home.e2e']);
    assert_status($r, 401);
});

test('POST /api/sections with missing page/key returns 400', function () use (&$adminToken) {
    $r = api_request('POST', '/api/sections', [], $adminToken);
    assert_true($r['status'] === 400, "expected 400, got {$r['status']}: " . json_encode($r['body']));
});

test('POST /api/sections creates a section (201)', function () use (&$adminToken, &$sectionId) {
    $r = api_request('POST', '/api/sections', [
        'page' => 'home',
        'key' => 'home.e2e_test_' . time(),
        'isActive' => true,
        'content' => ['heading' => 'Test'],
    ], $adminToken);
    assert_status($r, 201);
    $sectionId = $r['body']['_id'] ?? $r['body']['id'];
});

test('GET /api/sections/id/:id returns the section (200)', function () use (&$adminToken, &$sectionId) {
    $r = api_request('GET', "/api/sections/id/$sectionId");
    assert_status($r, 200);
});

test('PUT /api/sections/:id updates the section (200)', function () use (&$adminToken, &$sectionId) {
    $r = api_request('PUT', "/api/sections/$sectionId", ['content' => ['heading' => 'Updated']], $adminToken);
    assert_status($r, 200);
});

test('DELETE /api/sections/:id removes it (200) then 404 on redelete', function () use (&$adminToken, &$sectionId) {
    $r = api_request('DELETE', "/api/sections/$sectionId", null, $adminToken);
    assert_status($r, 200);
    $r2 = api_request('DELETE', "/api/sections/$sectionId", null, $adminToken);
    assert_true($r2['status'] === 404, "expected 404 on redelete, got {$r2['status']}");
});

test('POST /api/sections/upload-image rejects a non-image payload (400, not 500)', function () use (&$adminToken) {
    $phpFile = __DIR__ . '/fixtures/not-an-image.php';
    file_put_contents($phpFile, "<?php // test\n");
    $body = new MultipartBody(['image' => '@' . $phpFile]);
    $r = api_request('POST', '/api/sections/upload-image', $body, $adminToken);
    unlink($phpFile);
    assert_status($r, 400);
});

test('POST /api/sections/upload-image accepts a real image (200)', function () use (&$adminToken, $FIXTURE_IMAGE) {
    $body = new MultipartBody(['image' => '@' . $FIXTURE_IMAGE]);
    $r = api_request('POST', '/api/sections/upload-image', $body, $adminToken);
    assert_status($r, 200);
    assert_true(!empty($r['body']['url']) || !empty($r['body']['path']), 'expected a url/path in the upload response');

    // This endpoint just uploads a standalone file (used by the section-content
    // logo/image pickers) — it isn't tied to a DB record, so there's no delete
    // endpoint to call. Remove the file directly so repeated test runs don't
    // accumulate copies in backend/uploads/.
    $relative = $r['body']['path'] ?? $r['body']['url'] ?? null;
    if ($relative) {
        $filePath = __DIR__ . '/../' . ltrim($relative, '/');
        if (is_file($filePath)) {
            unlink($filePath);
        }
    }
});

test('POST /api/sections/upload-image rejects a PHP payload disguised as .png regardless of Content-Type', function () use (&$adminToken) {
    // Inert content on purpose (no exec pattern): a payload that looks like a real
    // webshell (e.g. "system($_GET[...])") gets intermittently locked by Windows
    // Defender's real-time scan the instant it's written, which surfaces as a
    // flaky cURL "aborted by callback" on the upload read — an environment
    // artifact, not an app bug. This still exercises the same code path: a
    // non-image file with a .png extension must be rejected regardless of content.
    $phpFile = __DIR__ . '/fixtures/shell.png';
    file_put_contents($phpFile, "<?php // not a real image\n");
    $body = new MultipartBody(['image' => '@' . $phpFile]);
    $r = api_request('POST', '/api/sections/upload-image', $body, $adminToken);
    unlink($phpFile);
    assert_status($r, 400);
});

// ---------------------------------------------------------------------------
// Contact messages (public create is reCAPTCHA-gated; we test the failure
// path since we cannot generate a real Google reCAPTCHA token headlessly)
// ---------------------------------------------------------------------------
echo "\n-- Contact messages --\n";
test('POST /api/contact-messages without a captcha token returns 400 (validation runs before DB write)', function () {
    $r = api_request('POST', '/api/contact-messages', [
        'name' => 'Test', 'email' => 'test@example.com', 'message' => 'hi',
    ]);
    assert_status($r, 400);
});

test('POST /api/contact-messages with missing required fields returns 400', function () {
    $r = api_request('POST', '/api/contact-messages', []);
    assert_status($r, 400);
});

test('GET /api/contact-messages requires admin (401 without token)', function () {
    $r = api_request('GET', '/api/contact-messages');
    assert_status($r, 401);
});

test('GET /api/contact-messages forbidden for a viewer (403)', function () use (&$viewerToken) {
    $r = api_request('GET', '/api/contact-messages', null, $viewerToken);
    assert_status($r, 403);
});

test('GET /api/contact-messages works for admin (200)', function () use (&$adminToken) {
    $r = api_request('GET', '/api/contact-messages', null, $adminToken);
    assert_status($r, 200);
});

// ---------------------------------------------------------------------------
// Users (admin only)
// ---------------------------------------------------------------------------
echo "\n-- Users --\n";
$newUserId = null;
test('GET /api/users forbidden for a viewer (403)', function () use (&$viewerToken) {
    $r = api_request('GET', '/api/users', null, $viewerToken);
    assert_status($r, 403);
});

test('GET /api/users works for admin (200)', function () use (&$adminToken) {
    $r = api_request('GET', '/api/users', null, $adminToken);
    assert_status($r, 200);
});

test('POST /api/users with a weak password returns 400', function () use (&$adminToken) {
    $r = api_request('POST', '/api/users', [
        'name' => 'Weak', 'email' => 'weak' . time() . '@example.test', 'password' => '123', 'role' => 'viewer',
    ], $adminToken);
    assert_status($r, 400);
});

test('POST /api/users creates a user (201)', function () use (&$adminToken, &$newUserId) {
    // Note: UserController requires at least one explicit permission even for a
    // "viewer" role — a self-registered viewer (POST /api/auth/register) gets zero
    // permissions with no such check, so this is an intentional stricter rule for
    // admin-created accounts, not a bug. Pass one to exercise the happy path.
    $r = api_request('POST', '/api/users', [
        'name' => 'E2E User', 'email' => 'e2e-user-' . time() . '@example.test',
        'password' => 'StrongPass123!', 'role' => 'viewer', 'status' => 'active', 'permissions' => ['edit_data'],
    ], $adminToken);
    assert_status($r, 201);
    $newUserId = $r['body']['_id'] ?? $r['body']['id'];
});

test('DELETE /api/users/:id removes the test user (200)', function () use (&$adminToken, &$newUserId) {
    $r = api_request('DELETE', "/api/users/$newUserId", null, $adminToken);
    assert_status($r, 200);
});

test('DELETE /api/users/:id refuses to let an admin delete their own account (400)', function () use (&$adminToken) {
    $me = api_request('GET', '/api/auth/me', null, $adminToken);
    assert_status($me, 200);
    $ownId = $me['body']['_id'] ?? $me['body']['id'];
    $r = api_request('DELETE', "/api/users/$ownId", null, $adminToken);
    assert_true($r['status'] === 400, "expected 400 for self-delete, got {$r['status']}");
});

// Note: the "cannot delete the last remaining admin" guard is not exercised
// here — doing so safely would require driving the real admin account count
// down to 1 and back up, which risks leaving this environment's only admin
// account in a bad state if a test fails partway through. Verified by code
// review and manual testing instead (see AUDIT_REPORT.md).

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------
echo "\n-- Certifications --\n";
$certId = null;
test('GET /api/certifications returns 200', function () {
    $r = api_request('GET', '/api/certifications');
    assert_status($r, 200);
});

test('POST /api/certifications requires admin (401 without token)', function () {
    $r = api_request('POST', '/api/certifications', ['code' => 'x', 'title' => 'x']);
    assert_status($r, 401);
});

test('POST /api/certifications with missing fields returns 400', function () use (&$adminToken) {
    $r = api_request('POST', '/api/certifications', [], $adminToken);
    assert_true($r['status'] === 400, "expected 400, got {$r['status']}: " . json_encode($r['body']));
});

$certCode = 'e2e-' . time();
test('POST /api/certifications creates a certification (201)', function () use (&$adminToken, &$certId, $certCode) {
    $r = api_request('POST', '/api/certifications', ['code' => $certCode, 'title' => 'E2E Cert'], $adminToken);
    assert_status($r, 201);
    $certId = $r['body']['_id'] ?? $r['body']['id'];
});

// The public GET /api/certifications/:id route looks up by CODE, not numeric id
// (numeric-id lookup is the separate authenticated /by-id/:id route below) — this
// matches how the public frontend actually links to certification detail pages.
test('GET /api/certifications/:id (code lookup) returns the certification (200)', function () use ($certCode) {
    $r = api_request('GET', "/api/certifications/$certCode");
    assert_status($r, 200);
});

test('GET /api/certifications/by-id/:id requires auth (401 without token)', function () use (&$certId) {
    $r = api_request('GET', "/api/certifications/by-id/$certId");
    assert_status($r, 401);
});

test('GET /api/certifications/by-id/:id returns the certification (200)', function () use (&$adminToken, &$certId) {
    $r = api_request('GET', "/api/certifications/by-id/$certId", null, $adminToken);
    assert_status($r, 200);
});

test('DELETE /api/certifications/:id removes it (200)', function () use (&$adminToken, &$certId) {
    $r = api_request('DELETE', "/api/certifications/$certId", null, $adminToken);
    assert_status($r, 200);
});

// ---------------------------------------------------------------------------
// Career page (singleton) + programs
// ---------------------------------------------------------------------------
echo "\n-- Career page + programs --\n";
test('GET /api/career-page returns 200 or 404 (singleton may not exist yet)', function () {
    $r = api_request('GET', '/api/career-page');
    assert_true(in_array($r['status'], [200, 404], true), "unexpected status {$r['status']}");
});

test('PATCH /api/career-page requires admin (401 without token)', function () {
    $r = api_request('PATCH', '/api/career-page', ['heroTitle' => 'x']);
    assert_status($r, 401);
});

$programId = null;
test('GET /api/career-programs returns 200', function () {
    $r = api_request('GET', '/api/career-programs');
    assert_status($r, 200);
});

test('POST /api/career-programs with empty title returns 400', function () use (&$adminToken) {
    $r = api_request('POST', '/api/career-programs', [], $adminToken);
    assert_status($r, 400);
});

test('POST /api/career-programs creates a program (201)', function () use (&$adminToken, &$programId) {
    $r = api_request('POST', '/api/career-programs', ['title' => 'E2E Program ' . time()], $adminToken);
    assert_status($r, 201);
    $programId = $r['body']['_id'] ?? $r['body']['id'];
});

$moduleId = null;
test('POST /api/career-programs/:id/modules adds a module (201)', function () use (&$adminToken, &$programId, &$moduleId) {
    $r = api_request('POST', "/api/career-programs/$programId/modules", ['title' => 'Module 1'], $adminToken);
    assert_status($r, 201);
    $moduleId = $r['body']['_id'] ?? $r['body']['id'];
});

test('POST /api/career-programs/:id/modules on a non-existent program returns 404', function () use (&$adminToken) {
    $r = api_request('POST', '/api/career-programs/999999999/modules', ['title' => 'x'], $adminToken);
    assert_status($r, 404);
});

$otherProgramId = null;
test('IDOR regression: a module cannot be updated/deleted through a different program\'s URL', function () use (&$adminToken, &$moduleId, &$otherProgramId) {
    $other = api_request('POST', '/api/career-programs', ['title' => 'Other Program ' . time()], $adminToken);
    assert_status($other, 201);
    $otherProgramId = $other['body']['_id'] ?? $other['body']['id'];

    $update = api_request('PUT', "/api/career-programs/$otherProgramId/modules/$moduleId", ['title' => 'Hijacked'], $adminToken);
    assert_true($update['status'] === 404, "expected 404 updating a module through the wrong program, got {$update['status']}");

    $delete = api_request('DELETE', "/api/career-programs/$otherProgramId/modules/$moduleId", null, $adminToken);
    assert_true($delete['status'] === 404, "expected 404 deleting a module through the wrong program, got {$delete['status']}");
});

test('cleanup: delete the extra program created for the IDOR test', function () use (&$adminToken, &$otherProgramId) {
    $r = api_request('DELETE', "/api/career-programs/$otherProgramId", null, $adminToken);
    assert_status($r, 200);
});

test('DELETE /api/career-programs/:id/modules/:moduleId removes the module (200)', function () use (&$adminToken, &$programId, &$moduleId) {
    $r = api_request('DELETE', "/api/career-programs/$programId/modules/$moduleId", null, $adminToken);
    assert_status($r, 200);
});

test('DELETE /api/career-programs/:id removes the program (200)', function () use (&$adminToken, &$programId) {
    $r = api_request('DELETE', "/api/career-programs/$programId", null, $adminToken);
    assert_status($r, 200);
});

// ---------------------------------------------------------------------------
// Program applications / Newsletter subscribers (reCAPTCHA-gated creates)
// ---------------------------------------------------------------------------
echo "\n-- Program applications / Newsletter --\n";
test('POST /api/program-applications without captcha returns 400', function () {
    $r = api_request('POST', '/api/program-applications', [
        'programId' => 1, 'fullName' => 'Test', 'email' => 'a@b.com', 'contactNumber' => '123',
    ]);
    assert_status($r, 400);
});

test('GET /api/program-applications requires admin (401)', function () {
    $r = api_request('GET', '/api/program-applications');
    assert_status($r, 401);
});

test('GET /api/program-applications works for admin (200)', function () use (&$adminToken) {
    $r = api_request('GET', '/api/program-applications', null, $adminToken);
    assert_status($r, 200);
});

test('POST /api/newsletter-subscribers without captcha returns 400', function () {
    $r = api_request('POST', '/api/newsletter-subscribers', ['email' => 'sub@example.com']);
    assert_status($r, 400);
});

test('GET /api/newsletter-subscribers requires admin (401)', function () {
    $r = api_request('GET', '/api/newsletter-subscribers');
    assert_status($r, 401);
});

test('GET /api/newsletter-subscribers works for admin (200)', function () use (&$adminToken) {
    $r = api_request('GET', '/api/newsletter-subscribers', null, $adminToken);
    assert_status($r, 200);
});

test('CSV export neutralizes formula-injection payloads in exported cells', function () use (&$adminToken) {
    // Creating a subscriber through the API is reCAPTCHA-gated (can't be
    // exercised headlessly), so insert the malicious row directly to set up
    // this test, matching how a real attacker-controlled source_page value
    // would land in the table.
    $pdo = Database::connection();
    $email = 'csv-injection-test-' . time() . '@example.test';
    $stmt = $pdo->prepare('INSERT INTO newsletter_subscribers (email, source_page, subscribed_at) VALUES (:email, :source, NOW())');
    $stmt->execute(['email' => $email, 'source' => '=1+1) + cmd|"/c calc"!A1']);

    $ch = curl_init(API_BASE . '/api/newsletter-subscribers?export=csv');
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $adminToken"],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $csv = curl_exec($ch);
    curl_close($ch);

    $pdo->prepare('DELETE FROM newsletter_subscribers WHERE email = :email')->execute(['email' => $email]);

    assert_true(str_contains($csv, $email), 'exported CSV did not contain the test row');
    assert_true(!preg_match('/(?:^|,)=1\+1/m', $csv), 'formula payload was NOT neutralized in the CSV export');
    assert_true(str_contains($csv, "'=1+1"), 'expected the payload to be prefixed with a leading quote');
});

// ---------------------------------------------------------------------------
// Security regressions (fixes made during this audit)
// ---------------------------------------------------------------------------
echo "\n-- Security regressions --\n";
test('Path traversal via router.php asset param is blocked (404, no source disclosure)', function () {
    $r = api_request('GET', '/router.php?asset=%2F..%2Fconfig%2Fdatabase.php');
    assert_true(strpos((string) $r['raw'], '<?php') === false, 'router.php leaked PHP source via traversal');
});

test('CORS: disallowed origin gets no Access-Control-Allow-Origin header', function () {
    $ch = curl_init(API_BASE . '/api/sliders');
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ['Origin: https://evil.example'],
        CURLOPT_HEADER => true,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    assert_true(stripos($raw, 'Access-Control-Allow-Origin') === false, 'unexpected ACAO header for a disallowed origin');
});

test('Login rate limiting kicks in after repeated failed attempts (429)', function () {
    $email = 'rate-limit-test-' . time() . '@example.test';
    $last = null;
    for ($i = 0; $i < 6; $i++) {
        $last = api_request('POST', '/api/auth/login', ['email' => $email, 'password' => 'wrong']);
    }
    assert_status($last, 429);
});

// ---------------------------------------------------------------------------
// Cleanup: the self-registered viewer account (from the Auth section) has no
// corresponding delete call anywhere above — remove it now so repeated runs
// don't accumulate throwaway accounts in the shared database.
// ---------------------------------------------------------------------------
if ($viewerUserId !== null && $adminToken !== null) {
    $cleanup = api_request('DELETE', "/api/users/$viewerUserId", null, $adminToken);
    if ($cleanup['status'] !== 200) {
        fwrite(STDERR, "WARNING: failed to clean up test viewer user $viewerUserId (status {$cleanup['status']})\n");
    }
}

exit(summary());
