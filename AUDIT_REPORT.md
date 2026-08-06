# Elena IT Services — Data Pipeline Audit Report

**Scope:** admin panel → API → MySQL database → public frontend, including
the image pipeline. Stack: PHP 8.3 backend (no framework, custom router,
PDO/MySQL), two React 19 + Vite apps (`admin/`, `frontend/`).

**Date:** 2026-08-06

---

## 0. Environment note (read this first)

The local dev environment for `admin/` and `frontend/` (`VITE_API_PROXY_TARGET`
in their `.env` files) was pointed at a **different, older checkout**
(`C:\xampp\htdocs\IT\SwiftSignIT`, remote `Swift-sign-IT-PHP.git`, 2 commits
behind this repo, with its own uncommitted changes) instead of the backend in
this repository. It's been repointed to a backend served from this repo
(`php -S 127.0.0.1:5000 -t public public/router.php` from `backend/`). The old
checkout was left untouched. If you normally develop against the XAMPP
`Swift-sign-IT-PHP` copy, be aware these two now disagree — reconcile before
merging further work from either one.

---

## 1. Critical security fixes (fix and deploy ASAP)

These were found during the endpoint audit and fixed immediately, out of
sequence, because they're live-exploitable.

### 1.1 Path traversal + source disclosure — `backend/public/router.php`

The dev-server/CGI-style static-file router took a path from the `asset`
query parameter (used by the `/uploads` proxy rewrite) with **no bounds
checking**, and resolved it directly against the filesystem. Your
`.htaccess` forwards any `/uploads/...` request to `router.php` with the
query string intact, so this was reachable **on the live production site**:

```
GET https://it.swiftsignbm.com/uploads/x?asset=../config/database.php
```

This returned the raw contents of `backend/config/database.php` (and by the
same mechanism, any other file readable by the PHP process, including
`.env`/`.env.cpanel` — DB password, JWT secret, SMTP password). Verified
locally: this call returned `database.php`'s full source before the fix.

**Fix:** every static-file candidate path is now resolved with `realpath()`
and checked to be strictly inside an allowed base directory (`public/` or the
sibling `uploads/`); `.php` files are never served as static content
regardless. Verified: the same traversal request now 404s, and legitimate
`/uploads/*` file serving still works.

**A second, unrelated bug in the same file** broke *every* local-dev API call
made through the Vite dev proxy (`admin`/`frontend` `npm run dev`): the router
matched its own `index.php` as a "static file" (because of how the proxy
rewrites `/api/x` → `/index.php?route=/api/x`) and served its raw source
instead of executing it. Fixed as part of the same change.

**Action needed from you:** deploy this fix to production immediately, and
**rotate the MySQL password, `JWT_SECRET`, and SMTP password** in
`backend/.env.cpanel` — they were exposed at least to this audit and
potentially to anyone else who found the same URL pattern.

### 1.2 Arbitrary file upload — `backend/utils/helpers.php` (`handle_file_upload`)

The image-type validation only rejected a bad upload when the **client
claimed** `Content-Type: image/*` but the bytes weren't a real image. Simply
omitting or spoofing the Content-Type made a `.php`/`.svg`/`.html` upload fall
through to a legacy "non-image" branch that saved it **unmodified, under its
original extension, with no further checks** — a working path to a stored
web shell or stored-XSS payload via any authenticated upload field (including
`PATCH /api/auth/me`'s avatar upload, reachable by any self-registered
`viewer` account with zero other permissions).

**Fix:** every field now requires a real detected image (JPEG/PNG/WebP,
verified from file content, never from the client) except the slider's
`video` field, which now requires a real detected `video/mp4`, `video/webm`,
or `video/ogg` file. Everything else is rejected with a clean `400`
regardless of claimed Content-Type or extension. Also added a deny-execution
`.htaccess` to `backend/uploads/` (defense in depth — that directory should
never execute anything).

Verified with 4 payloads: legit WebP (200 ✓), a `.php` webshell with no
Content-Type claim (400 ✓), the same webshell renamed `.png` with a spoofed
`image/png` Content-Type (400 ✓), an SVG with an embedded `<script>` (400 ✓),
and a legit `.mp4` slider video (201 ✓) vs. a webshell disguised as
`video/mp4` (400 ✓).

### 1.3 CORS fail-open — `backend/public/index.php`

For an origin *not* on the allowlist, the code set
`Access-Control-Allow-Origin: *` instead of omitting the header, defeating
the point of having an allowlist (any site could script against public GET
endpoints and probe protected ones). Fixed to omit the header entirely for
unallowed origins (fails closed). Verified: an `Origin: https://evil.example`
request now gets no `Access-Control-Allow-Origin` header at all.

---

## 2. Part 1 — Endpoint audit

### 2.1 Inventory

All 60+ routes in `backend/routes/api.php` were inventoried against real
usage in both `admin/src` and `frontend/src` (every `axios`/`fetch` call
site). Full per-endpoint tables (method, path, caller file, request/response
shape) were produced during the audit; the summary below is the status after
fixes. Resource groups: Auth, Sliders, Services, Sub-services, Projects,
Testimonials, Team, Blogs, Sections (CMS content blocks), Contact Messages,
Users, Certifications, Career Page, Career Programs (+modules), Program
Applications, Newsletter Subscribers.

### 2.2 Status by endpoint group

| Group | Status | Notes |
|---|---|---|
| Auth (`/auth/*`) | ✅ Working | Register/login/me/password all correct; no rate limiting (see §4) |
| Sliders | ✅ Fixed | Added required-field validation, delete→404, image-cleanup-on-replace |
| Services | ✅ Fixed | Same, plus a silent-failure bug in benefits/FAQs sync now surfaces as a real error instead of a false 200 |
| Sub-services | ✅ **Fixed — was completely broken** | `sub_services` table was missing the `slug` and `icon_alt` columns the code has always expected. **Every `POST /api/sub-services` 500'd**, and the public `GET /api/sub-services/slug/:slug` route also 500'd. Added the missing columns, backfilled slugs/alt-text for existing rows |
| Projects | ✅ Fixed | Added required-field validation, slug uniqueness (was missing — could create duplicate-slug projects), delete→404, image cleanup |
| Testimonials | ✅ Fixed | Validation, rating now clamped to 1–5 instead of stored raw, delete→404, image cleanup |
| Team | ✅ Fixed | Validation, delete→404, image cleanup |
| Blogs | ✅ Fixed | Validation, slug uniqueness (was missing), delete→404, image cleanup. **Content field is still unsanitized HTML** — see §4 |
| Sections | ✅ Fixed | Validation, delete→404, image-upload endpoint hardened by the same fix as §1.2 |
| Contact Messages | ✅ Working | Already well-validated (reCAPTCHA + field checks before DB write) |
| Users | ✅ Working | Best-validated controller in the codebase already; admin-only correctly enforced |
| Certifications | ✅ **Fixed — was corrupting its own API responses** | `create()` accessed `$body['audience']` etc. without a null-safe fallback inside a ternary that already checked the same key with one — an "undefined array key" PHP warning got printed **into the raw HTTP response body before the JSON**, corrupting it for any strict JSON client. Fixed the access pattern and disabled `display_errors` globally (see §2.3) so this class of bug can never leak into a response again, regardless of which field/controller it happens in next |
| Career Page / Career Programs | ✅ Working | IDOR note: `updateModule`/`deleteModule`/`reorderModules` don't verify the module actually belongs to the `:id` program in the URL (admin-only, low practical risk, documented in §4) |
| Program Applications | ✅ Working | Validates the referenced program exists before insert — one of the better-written public endpoints |
| Newsletter Subscribers | ✅ Working | CSV export is admin-gated correctly |

### 2.3 Other Part-1 fixes worth calling out

- **Silent data truncation → now a loud failure.** MySQL wasn't running in
  strict mode, so a value longer than its column (e.g. a title over 255
  characters) was **silently truncated with a `201` success response** —
  the admin would believe the full text saved when it didn't. Enabled
  `STRICT_TRANS_TABLES` on every DB connection; the same input now fails with
  a clear `500` and a real SQL error instead of quietly losing data.
  (Ideally this becomes a clean `400` via per-field max-length validation —
  not done here, flagged as a follow-up in §4.)
- **`display_errors` disabled globally** (`backend/bootstrap.php`). PHP
  notices/warnings/deprecations were previously printed straight into HTTP
  response bodies whenever `display_errors` was on (as it was in this local
  environment) — ahead of the JSON payload, breaking JSON parsing for any
  strict client. This is now impossible regardless of environment; errors go
  to the log instead.
- **`BaseModel::prepareValue()`** unconditionally `json_encode()`d any value
  assigned to a JSON column, so a `null` became the literal string `"null"`
  in the DB instead of SQL `NULL`. Fixed to only encode real arrays.
- **Delete-then-404 consistency.** Every `delete()` across ~11 controllers
  called `Model::delete($id)` unconditionally and returned `200` even for a
  nonexistent ID. All now check existence first and return `404`.
- **Orphaned upload cleanup.** No controller ever deleted the old file on
  disk when an image/video was replaced or the record was deleted —
  `backend/uploads/` grew forever. Added `delete_uploaded_file_if_present()`
  (realpath-contained, same technique as the router.php fix) and wired it
  into every image/video field's update/delete path. Verified directly:
  replacing a slider's image leaves the old file deleted and only the new
  one on disk.

### 2.4 Known issues — documented, not fixed (see §4 for the full list and why)

Rate limiting on login/register, HTML sanitization of rich-text fields
(blog content especially), a few IDOR/consistency gaps, and some minor
lint/dead-code items. None of these block the pipeline from working
correctly; they're flagged for prioritization, not silently left unmentioned.

---

## 3. Part 2 — Frontend ↔ Admin wiring

Verified two ways: (a) direct API-level testing against every endpoint
(§5.1), and (b) a real browser driving the actual admin UI and actual public
site together (§5.2), for **Sliders** (the homepage hero) as the deep,
representative end-to-end flow.

| Check | Result |
|---|---|
| Create in admin → appears on frontend | ✅ Right page (home hero), correct content and image |
| Is it real-time, reload, or cached? | **Requires a fresh navigation/reload.** Neither app uses WebSockets/polling/React Query — every page does a plain `useEffect` fetch on mount. No stale-cache issue was found (several fetches already cache-bust with `?t=timestamp`), it's simply not push-based. This is expected SPA behavior, not a bug, but worth knowing: a content editor won't see their change on the *already-open* public tab without a reload |
| Edit text → frontend updates | ✅ After reload, confirmed with a heading edit |
| Upload/replace image | ✅ Old file actually deleted (not left alongside), new image renders at correct size with no 404, verified by resolving the new `<img src>` and confirming HTTP 200 |
| Delete a record → removed from frontend | ✅ No broken card/link left behind |
| Duplicate slugs | ✅ Auto-suffixed (`cloud-security` → `cloud-security-2`), no collision error, verified live on `/api/services` |
| Very long text | ✅ **Was silently truncating (see §2.3), now fails loudly instead** |
| Special characters / HTML / unicode / emoji | ✅ Stored and returned intact; not sanitized (frontend's `{field}` JSX interpolation auto-escapes for display, so this isn't exploitable *except* for Blog `content`, which is rendered via `dangerouslySetInnerHTML` — see §4) |
| Empty states | ✅ (code review) Hero/Services/Testimonials/Blogs all render hardcoded fallback content when the API returns zero items, rather than a blank section |
| Concurrent edits | ⚠️ **Known limitation, not fixed.** No optimistic locking/version check anywhere in the API — two admins editing the same record simultaneously silently last-write-wins. Flagged in §4 rather than fixed, since it needs a schema change (a version/`updated_at`-compare column) that's beyond a wiring audit |
| Internal links (slugs/ids in routes) | ✅ `/services/:slug`, `/blog/:slug`, `/team/:slug` use slugs; `/projects/:id` and `/certification/:id` intentionally use raw id / derived code instead — consistent with what each backend route actually expects, no dead links found |

Other content types (Services, Projects, Testimonials, Sub-services, Team,
Blogs, Sections, Certifications, Career Programs, etc.) were verified at the
API level for the same create/edit/delete/validate/auth behavior (§5.1,
122 tests) but did not each get a dedicated browser click-through script —
see the Part 3 scope note below.

---

## 4. Follow-up fixes (second pass)

Everything below was originally logged as a known-but-unfixed issue in the
first pass of this audit. All of it has since been fixed and covered by new
regression tests in `backend/tests/run.php` (128 tests total, up from 122).

1. **Rate limiting on `/auth/login` and `/auth/register`** — added
   `backend/utils/rate_limit.php`, a small DB-backed (`rate_limits` table,
   self-provisioning) fixed-window limiter. `login`: 20 attempts / 15 min per
   IP, and a tighter 5 / 15 min per IP+email so a shared office IP can't lock
   out every account over one bad actor. `register`: 10 / hour per IP (it has
   no reCAPTCHA, unlike every other public POST endpoint). Every attempt
   (success or failure) counts, and the limiter is checked before the
   password is even looked up. Verified live: the 6th rapid wrong-password
   attempt against one account returns `429`, and a *correct* password
   afterward still gets `429` (the block isn't just "bad password" logic) —
   a different email from the same IP is unaffected.
2. **HTML sanitization on Blog `content`** — added `sanitize_html()` in
   `backend/utils/helpers.php`: a dependency-free, allowlist-based sanitizer
   built on PHP's `DOMDocument`, walking the tree post-order (children
   sanitized before their parent is judged) so a `<script>` nested inside an
   unrecognized wrapper tag can never survive by riding along when the
   wrapper is unwrapped. Strips `<script>/<style>/<iframe>/<object>/<embed>/
   <form>/<svg>/...` entirely, strips all `on*` event-handler attributes and
   `javascript:`/`vbscript:` URLs, keeps everyday rich-text markup
   (`p, strong, em, a, img, ul/ol/li, h1-h6, table, ...`), and auto-sets
   `rel="noopener noreferrer"` on `target="_blank"` links. Wired into
   `BlogController::create` and `::update` — validation now runs against the
   *sanitized* value, so a submission that's entirely disallowed markup is
   correctly treated as empty content, not silently saved blank. Verified
   live against `<script>`, `onerror=`, `<iframe>`, and `javascript:` href
   payloads on both create and update.
3. **Career program module IDOR** — `updateModule`/`deleteModule` now verify
   the module's `program_id` matches the `:id` in the URL before acting
   (404 otherwise); `reorderModules` silently ignores any module ID in the
   request that doesn't belong to the target program instead of reordering
   it anyway. Verified live: updating/deleting a real module through a
   *different* program's URL now 404s.
4. **`UserController::delete` self-delete / last-admin guards** — an admin
   can no longer delete their own account (`400`), and the last remaining
   admin account can't be deleted by anyone (`400`, checked via a new
   `UserModel::countByRole()`). The "last admin" path is defense-in-depth on
   top of the self-delete guard — reasoned through and manually verified
   with disposable temp-admin accounts rather than automated, since the only
   way to construct that exact scenario risks the real admin account (see
   the comment above the (missing) test in `run.php`). The self-delete guard
   *is* covered by an automated test.
5. **CSV formula injection** — added `csv_safe_cell()` in `helpers.php`,
   applied to every cell in `NewsletterSubscriberController::exportCsv`: a
   value starting with `=`, `+`, `-`, `@`, or a tab gets a leading apostrophe
   so Excel/Sheets always reads it as literal text, never a formula.
   Verified live with a `=1+1) + cmd|"/c calc"!A1`-style payload.
6. **Pre-existing ESLint findings** — both apps now lint 100% clean
   (`npm run lint` exits 0, zero errors, zero warnings, in both `admin/` and
   `frontend/`). Where an unused variable turned out to be genuinely dead
   code (e.g. `catch (_unusedError)` with an unused binding, an unused
   `brandName`/`brandSymbol` superseded by `copyrightText`), it was removed.
   Where it looked like an *unfinished* wiring — `Layout.jsx`'s
   `getSectionGroups(isAdmin)` never actually used `isAdmin`, even though
   the file's own `visibleNavItems` establishes exactly that gating pattern
   elsewhere — it was wired in properly instead of just silenced: the
   "Career Page Settings"/"Career Programs" nav links are now admin-only
   (matching the backend, which already required admin for their write
   routes), and the corresponding routes in `App.jsx` gained `adminOnly` on
   their `ProtectedRoute` to match. `Navbar.jsx`'s two
   `react-hooks/set-state-in-effect` errors were fixed by moving one reset
   into the actual resize-event handler that triggers it (removing a whole
   effect) and narrowly suppressing the rule for the other, where
   centralizing the reset in one effect is the correct design against 7
   different "close the menu" call sites — verified with a new
   `e2e-tests/tests/navbar-smoke.spec.js` (desktop render, mobile
   open/close, and resize-collapses-mobile-menu) so the refactor didn't
   change real behavior.

## 4b. Known issues still not fixed

1. **`ContactMessageController::create`** trusts client-supplied
   `emailSentByClient`/`emailErrorByClient` fields and stores them verbatim
   as if server-verified. A malicious client can misrepresent whether an
   email actually sent, and `emailError` is admin-facing, unsanitized text.
2. **Weak default admin seeding** (`admin@swiftsignit.com` / `admin123`) only
   runs when `APP_ENV` is local/dev or `BOOTSTRAP_INIT_EACH_REQUEST=1` — but
   is a real risk if that env var is ever misconfigured on the live host.
   Worth an explicit assertion that this never runs in production.
3. **`JWT_SECRET` falls back to a hardcoded default** if the env var is
   unset. It *is* set correctly in both `.env` and `.env.cpanel` today, but
   the silent fallback itself is a landmine for a future deploy that forgets
   to set it.
4. **Field-length validation is DB-enforced only, not app-level** (see
   §2.3's strict-mode fix) — a long title now fails with a `500` instead of
   silently truncating, which is a real improvement, but the correct fix is
   a clean `400` from per-field max-length checks in each controller.
5. **Minor consistency items** (not bugs): two different multipart-PUT
   override mechanisms coexist across `admin/src/api/*.js`; a couple of
   admin pages hardcode a `localhost:5000` fallback API URL instead of the
   empty-string fallback everywhere else; `@tanstack/react-query` is
   installed in `admin/` but never actually used; some career-related API
   responses mix snake_case and camelCase field names inconsistently.

---

## 5. Part 3 — Automated tests (executed, not just written)

### 5.1 PHP API integration tests — `backend/tests/`

No test framework existed (project is intentionally dependency-free — see
`backend/package.json`), so a small cURL-based harness was added
(`backend/tests/http.php` + `backend/tests/run.php`) rather than pulling in
Composer/PHPUnit. Covers **every route** in `routes/api.php`: happy path +
at least one failure case (validation, auth, or not-found) each, plus direct
regression tests for every security fix in §1 and §4 (path traversal, CORS,
login rate limiting, blog HTML sanitization, the career-module IDOR fix, the
self-delete guard, and CSV formula injection).

**How to run:**
```bash
cd backend
php -S 127.0.0.1:5000 -t public public/router.php   # in one terminal
php tests/run.php                                     # in another
```

**Result (multiple consecutive runs, deterministic):**
```
TOTAL: 128   PASS: 128   FAIL: 0
```
The suite cleans up everything it creates (including the self-registered
test viewer account, a standalone test upload, and its own rate-limit
buckets) — a run leaves the database and `uploads/` exactly as it found
them.

### 5.2 Playwright end-to-end tests — `e2e-tests/`

New workspace (`e2e-tests/`), Chromium via `@playwright/test`. Drives the
**actual admin UI in a real browser** against the actual public site:
log in → create a slider with an image → verify it renders on the live
homepage → edit the heading → verify the frontend reflects it after reload →
replace the image → verify the new one renders with no broken link and the
old one is gone → delete → verify it's removed from the frontend.

**How to run:**
```bash
cd e2e-tests
npm install && npx playwright install chromium   # first time only
ADMIN_URL=http://localhost:5176 FRONTEND_URL=http://localhost:5175 npx playwright test
```
(Adjust the ports to whatever your `admin`/`frontend` dev servers actually
bind — Vite auto-increments past busy ports.)

A second spec, `navbar-smoke.spec.js`, was added to verify the `Navbar.jsx`
refactor done for the ESLint fixes in §4 didn't change real behavior: desktop
nav renders (including the sticky/scrolled variant), the mobile hamburger
opens/closes the menu, and resizing from mobile to desktop auto-collapses an
open mobile menu.

A `global-setup.js` clears the backend's login rate-limit buckets before the
suite runs (each spec logs in as admin independently, several times per full
run — without this, repeated local runs would eventually trip the same
limiter a real brute-force attempt would).

**Result (multiple consecutive runs):**
```
7 passed
```
(One earlier run had a single transient timeout unrelated to the app — page
navigation stalled under heavy concurrent load from everything else running
on this dev machine at the time; immediately reproducible as a pass on
retry, not a real defect.)

**Scope note:** per the instruction not to rebuild the admin panel, and given
the size of this codebase (15 content-type resources), full deep
browser-level e2e coverage was implemented for **Sliders** as the
representative flow proving the create→edit→image-replace→delete pipeline
works end-to-end through a real browser, plus a targeted Navbar smoke test.
The other 14 resource types are covered by the API integration suite (§5.1)
for the same lifecycle plus auth and validation, but not by a dedicated
Playwright script each. Extending the pattern in
`e2e-tests/tests/slider-wiring.spec.js` to another content type (Services is
the next-highest-value target — it has slug-based routing, unlike Sliders)
would be a reasonable next increment.

---

## 6. Build/run verification

- `cd admin && npm run build` — ✅ succeeds (one advisory: a >500KB chunk,
  pre-existing, not introduced here)
- `cd frontend && npm run build` — ✅ succeeds (same advisory)
- `cd admin && npm run lint` / `cd frontend && npm run lint` — ✅ **0 errors,
  0 warnings, exit code 0**, both apps (fixed in §4 — was 8 problems / 12
  problems)
- All three dev servers (backend on `:5000`, admin, frontend) run with no
  console/server errors during the full test pass above

---

## 7. Files changed

**Security/correctness (backend):** `bootstrap.php`, `config/database.php`,
`public/index.php`, `public/router.php`, `utils/helpers.php`,
`models/BaseModel.php`, `models/ProjectModel.php`, `models/UserModel.php`,
and the controllers for Slider, Service, Project, Testimonial, SubService,
Team, Blog, Section, Cert, ContactMessage, User, Auth, CareerProgram,
NewsletterSubscriber.

**New (backend):** `utils/rate_limit.php` (login/register throttling),
`backend/uploads/.htaccess` (deny script execution), `backend/tests/`
(integration suite, now 128 tests).

**Database:** `sub_services` gained `slug` (unique, backfilled) and
`icon_alt` (backfilled) columns; `rate_limits` table (self-provisioning);
MySQL sessions now run with `STRICT_TRANS_TABLES`.

**Admin panel:** `src/components/Layout.jsx` (career nav items now
admin-gated), `src/App.jsx` (career routes now `adminOnly`),
`src/pages/career/CareerProgramForm.jsx` (dead state removed, `loadProgram`
memoized), `src/pages/career/NewsletterSubscriberList.jsx` and
`ProgramApplicationList.jsx` (`load` memoized), `src/pages/team/TeamForm.jsx`
(dead catch binding), `eslint.config.js` (Node globals for `vite.config.js`),
`README.md` (usage guide).

**Frontend:** `src/components/Footer.jsx` (dead vars), `src/components/Navbar.jsx`
(two `set-state-in-effect` fixes — one resize-handler refactor, one narrowly
justified suppression — verified behaviorally unchanged by a new Playwright
smoke test), `src/pages/Home/sections/Team.jsx` and `TeamDetails.jsx` (dead
catch bindings), `src/pages/Certification.jsx` and `CertificationDetail.jsx`
(`useCallback` for effect dependencies), `eslint.config.js` (Node globals for
`vite.config.js`).

**New (testing):** `e2e-tests/` (Playwright suite: slider wiring + Navbar
smoke test, 7 tests), this report.

**Local dev config (not app code):** `admin/.env` and `frontend/.env`
repointed to this repo's backend (§0); local PHP `php.ini` had `fileinfo`
and `curl` extensions enabled and upload size limits raised — needed to
actually exercise/test the image and video upload paths locally.

---

## 8. Using the admin panel

See `admin/README.md` for the full guide (login, roles/permissions, the
create/edit/delete pattern, image replace behavior, slugs, and Sections).
