# Elena IT Services — Admin Panel

React + Vite admin panel for managing the content shown on the public Elena IT
Services website. Talks to the PHP backend in `../backend` over `/api`.

## Local development

```bash
npm install
npm run dev
```

The dev server proxies `/api` and `/uploads` to whatever `VITE_API_PROXY_TARGET`
points at in `.env` — point it at a running instance of `../backend` (e.g.
`php -S 127.0.0.1:5000 -t public public/router.php` from `backend/`, with
`VITE_API_PROXY_TARGET=http://127.0.0.1:5000`).

## How to use the admin panel

### Logging in

Go to `/login` and sign in with an account created by another admin (or the
seeded default admin — see `backend/.env`'s `DEFAULT_ADMIN_EMAIL` /
`DEFAULT_ADMIN_PASSWORD`, local dev only). Sessions are JWT-based and expire
after `JWT_EXPIRE` (see `backend/.env`, default 7 days).

### Roles and permissions

Every account has a **role** (`admin`, `editor`, `viewer`) and a set of
**permissions** (`add_data`, `edit_data`, `delete_data`, `publish_data`):

- **admin** — all permissions, plus access to Users, Contact Messages,
  Certifications, Career Programs, Program Applications, and Newsletter
  Subscribers (these sections require the `admin` role specifically, not just
  a permission).
- **editor** — `add_data`, `edit_data`, `publish_data` by default (no
  `delete_data` unless explicitly granted).
- **viewer** — no permissions by default; read-only.

An admin can override any user's permissions individually from **Users** →
edit user, regardless of their role's defaults.

### Managing content

Each content type in the left nav (Sliders, Services, Sub Services, Projects,
Team, Testimonials, Blogs, Certifications, Career Programs) follows the same
pattern:

1. **List page** — shows all records, with **Edit**, **Delete**, and an
   active/inactive toggle. Only *active* records are shown on the public site.
2. **+ Add New** — opens a blank form.
3. **Edit** — opens the same form pre-filled.
4. Saving redirects back to the list. The change is live on the public site on
   its **next page load** — the site does not auto-refresh in the background,
   so if you have the public site open in another tab, reload it to see the
   update.

**Images**: uploading a new image on an existing record replaces the old one
(the old file is deleted from the server once the new one saves successfully).
Only real JPG/PNG/WebP images are accepted — anything else is rejected with a
clear error, regardless of what extension it has. Images are automatically
converted to WebP for consistent, smaller file sizes.

**Slugs**: most content types generate a URL slug from the title automatically
(editable before saving). If a slug is already taken, a `-2`, `-3`, etc. is
appended automatically — you won't get a duplicate-slug error.

**Sections** (in the collapsible "Sections" nav group) edit fixed blocks of
page copy — navbar, footer, homepage sections, about page, contact page,
career page — rather than a list of records. Each section page is a single
form tied to one `page` + `key`.

### Contact Messages / Program Applications / Newsletter Subscribers

These are read-only inboxes fed by the public site's forms — there's nothing
to "publish" here, just mark-as-read, review, and (for messages) delete.

### Settings

Your own profile (name, email, avatar, password) is under **Settings**, not
**Users** — **Users** is for managing *other* accounts and is admin-only.

## Production build

```bash
npm run build
```

Outputs to `dist/`, deployed under the `VITE_PUBLIC_BASE` path (default
`/admin/`) — see `.env.production`.
