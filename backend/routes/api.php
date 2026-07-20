<?php
require_once __DIR__ . '/../utils/Router.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/PermissionMiddleware.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/SliderController.php';
require_once __DIR__ . '/../controllers/ServiceController.php';
require_once __DIR__ . '/../controllers/ProjectController.php';
require_once __DIR__ . '/../controllers/TestimonialController.php';
require_once __DIR__ . '/../controllers/SubServiceController.php';
require_once __DIR__ . '/../controllers/TeamController.php';
require_once __DIR__ . '/../controllers/BlogController.php';
require_once __DIR__ . '/../controllers/SectionContentController.php';
require_once __DIR__ . '/../controllers/ContactMessageController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/CertController.php';
require_once __DIR__ . '/../controllers/CareerProgramController.php';
require_once __DIR__ . '/../controllers/CareerPageContentController.php';
require_once __DIR__ . '/../controllers/ProgramApplicationController.php';
require_once __DIR__ . '/../controllers/NewsletterSubscriberController.php';


$router = new Router();

// WebP capability health check
$router->add('GET', '/api/health/webp', function () {
    $report = get_webp_capability_report();
    return [
        'status' => 200,
        'data' => [
            'ok' => true,
            'webp' => $report,
        ],
    ];
});

// Auth
$router->add('POST', '/api/auth/register', [AuthController::class, 'register']);
$router->add('POST', '/api/auth/login', [AuthController::class, 'login']);
$router->add('GET', '/api/auth/me', function ($context) {
    AuthMiddleware::protect();
    return AuthController::getMe($context);
});
$router->add('PATCH', '/api/auth/me', function ($context) {
    AuthMiddleware::protect();
    return AuthController::updateMe($context);
});
$router->add('PUT', '/api/auth/me', function ($context) {
    AuthMiddleware::protect();
    return AuthController::updateMe($context);
});
$router->add('PATCH', '/api/auth/me/password', function ($context) {
    AuthMiddleware::protect();
    return AuthController::changeMyPassword($context);
});
$router->add('PUT', '/api/auth/me/password', function ($context) {
    AuthMiddleware::protect();
    return AuthController::changeMyPassword($context);
});
$router->add('POST', '/api/auth/me/password', function ($context) {
    AuthMiddleware::protect();
    return AuthController::changeMyPassword($context);
});

// Sliders
$router->add('GET', '/api/sliders', [SliderController::class, 'list']);
$router->add('GET', '/api/sliders/slug/:slug', [SliderController::class, 'showBySlug']);
$router->add('GET', '/api/sliders/:id', [SliderController::class, 'show']);
$router->add('POST', '/api/sliders', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return SliderController::create($context);
});
$router->add('PUT', '/api/sliders/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return SliderController::update($context);
});
$router->add('PATCH', '/api/sliders/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return SliderController::toggleActive($context);
});
$router->add('DELETE', '/api/sliders/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return SliderController::delete($context);
});

// Services
$router->add('GET', '/api/services', [ServiceController::class, 'list']);
$router->add('GET', '/api/services/slug/:slug', [ServiceController::class, 'showBySlug']);
$router->add('GET', '/api/services/:id', [ServiceController::class, 'show']);
$router->add('POST', '/api/services', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return ServiceController::create($context);
});
$router->add('PUT', '/api/services/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return ServiceController::update($context);
});
$router->add('PATCH', '/api/services/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return ServiceController::toggleActive($context);
});
$router->add('DELETE', '/api/services/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return ServiceController::delete($context);
});

// Projects
$router->add('GET', '/api/projects', [ProjectController::class, 'list']);
$router->add('GET', '/api/projects/:id', [ProjectController::class, 'show']);
$router->add('POST', '/api/projects', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return ProjectController::create($context);
});
$router->add('PUT', '/api/projects/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return ProjectController::update($context);
});
$router->add('PATCH', '/api/projects/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return ProjectController::toggleActive($context);
});
$router->add('DELETE', '/api/projects/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return ProjectController::delete($context);
});

// Testimonials
$router->add('GET', '/api/testimonials', [TestimonialController::class, 'list']);
$router->add('GET', '/api/testimonials/slug/:slug', [TestimonialController::class, 'showBySlug']);
$router->add('GET', '/api/testimonials/:id', [TestimonialController::class, 'show']);
$router->add('POST', '/api/testimonials', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return TestimonialController::create($context);
});
$router->add('PUT', '/api/testimonials/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return TestimonialController::update($context);
});
$router->add('PATCH', '/api/testimonials/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return TestimonialController::toggleActive($context);
});
$router->add('DELETE', '/api/testimonials/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return TestimonialController::delete($context);
});

// Sub services
$router->add('GET', '/api/sub-services', [SubServiceController::class, 'list']);
$router->add('GET', '/api/sub-services/slug/:slug', [SubServiceController::class, 'showBySlug']);
$router->add('GET', '/api/sub-services/:id', [SubServiceController::class, 'show']);
$router->add('POST', '/api/sub-services', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return SubServiceController::create($context);
});
$router->add('PUT', '/api/sub-services/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return SubServiceController::update($context);
});
$router->add('PATCH', '/api/sub-services/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return SubServiceController::toggleActive($context);
});
$router->add('DELETE', '/api/sub-services/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return SubServiceController::delete($context);
});

// Team
$router->add('GET', '/api/team', [TeamController::class, 'list']);
$router->add('GET', '/api/team/slug/:slug', [TeamController::class, 'showBySlug']);
$router->add('GET', '/api/team/:id', [TeamController::class, 'show']);
$router->add('POST', '/api/team', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return TeamController::create($context);
});
$router->add('PUT', '/api/team/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return TeamController::update($context);
});
$router->add('PATCH', '/api/team/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return TeamController::toggleActive($context);
});
$router->add('DELETE', '/api/team/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return TeamController::delete($context);
});

// Blogs
$router->add('GET', '/api/blogs', [BlogController::class, 'list']);
$router->add('GET', '/api/blogs/slug/:slug', [BlogController::class, 'showBySlug']);
$router->add('GET', '/api/blogs/:id', [BlogController::class, 'show']);
$router->add('POST', '/api/blogs', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return BlogController::create($context);
});
$router->add('PUT', '/api/blogs/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return BlogController::update($context);
});
$router->add('PATCH', '/api/blogs/:id/published', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return BlogController::togglePublished($context);
});
$router->add('DELETE', '/api/blogs/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return BlogController::delete($context);
});

// Section contents
$router->add('GET', '/api/sections', [SectionContentController::class, 'list']);
$router->add('GET', '/api/sections/id/:id', [SectionContentController::class, 'getById']);
$router->add('POST', '/api/sections/upload-image', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return SectionContentController::uploadImage($context);
});
$router->add('POST', '/api/sections', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('add_data');
    return SectionContentController::create($context);
});
$router->add('PUT', '/api/sections/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('edit_data');
    return SectionContentController::update($context);
});
$router->add('PATCH', '/api/sections/:id/active', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('publish_data');
    return SectionContentController::toggleActive($context);
});
$router->add('DELETE', '/api/sections/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requirePermission('delete_data');
    return SectionContentController::delete($context);
});
$router->add('GET', '/api/sections/:key', [SectionContentController::class, 'getByKey']);

// Contact messages
$router->add('POST', '/api/contact-messages', [ContactMessageController::class, 'create']);
$router->add('GET', '/api/contact-messages', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return ContactMessageController::list($context);
});
$router->add('PATCH', '/api/contact-messages/:id/read', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return ContactMessageController::toggleRead($context);
});
$router->add('DELETE', '/api/contact-messages/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return ContactMessageController::delete($context);
});

// Users
$router->add('GET', '/api/users', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return UserController::list($context);
});
$router->add('POST', '/api/users', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return UserController::create($context);
});
$router->add('PUT', '/api/users/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return UserController::update($context);
});
$router->add('DELETE', '/api/users/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return UserController::delete($context);
});

// Certifications
$router->add('GET', '/api/certifications', [CertController::class, 'getCertifications']);
$router->add('GET', '/api/certifications/by-id/:id', function ($context) {
    AuthMiddleware::protect();
    return CertController::getCertificationById($context);
});
$router->add('GET', '/api/certifications/:id', [CertController::class, 'getCertification']);
$router->add('POST', '/api/certifications', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CertController::create($context);
});
$router->add('PUT', '/api/certifications/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CertController::update($context);
});
$router->add('DELETE', '/api/certifications/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CertController::delete($context);
});
$router->add('POST', '/api/register', [CertController::class, 'registerInterest']);

// Career page content (singleton)
$router->add('GET', '/api/career-page', [CareerPageContentController::class, 'get']);
$router->add('PATCH', '/api/career-page', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerPageContentController::update($context);
});

// Career programs (public)
$router->add('GET', '/api/career-programs', [CareerProgramController::class, 'listPublic']);
$router->add('GET', '/api/career-programs/:id', [CareerProgramController::class, 'getOne']);

// Career programs (admin CRUD)
$router->add('GET', '/api/admin/career-programs', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::listAdmin($context);
});
$router->add('POST', '/api/career-programs', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::create($context);
});
$router->add('PUT', '/api/career-programs/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::update($context);
});
$router->add('DELETE', '/api/career-programs/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::delete($context);
});

// Career program modules (admin CRUD, nested under program)
$router->add('POST', '/api/career-programs/:id/modules', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::addModule($context);
});
$router->add('PUT', '/api/career-programs/:id/modules/:moduleId', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::updateModule($context);
});
$router->add('DELETE', '/api/career-programs/:id/modules/:moduleId', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::deleteModule($context);
});
$router->add('PATCH', '/api/career-programs/:id/modules/reorder', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return CareerProgramController::reorderModules($context);
});

// Program applications
$router->add('POST', '/api/program-applications', [ProgramApplicationController::class, 'create']);
$router->add('GET', '/api/program-applications', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return ProgramApplicationController::list($context);
});
$router->add('PATCH', '/api/program-applications/:id', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return ProgramApplicationController::updateStatus($context);
});

// Newsletter subscribers
$router->add('POST', '/api/newsletter-subscribers', [NewsletterSubscriberController::class, 'create']);
$router->add('GET', '/api/newsletter-subscribers', function ($context) {
    AuthMiddleware::protect();
    PermissionMiddleware::requireAdmin();
    return NewsletterSubscriberController::list($context);
});

return $router;

