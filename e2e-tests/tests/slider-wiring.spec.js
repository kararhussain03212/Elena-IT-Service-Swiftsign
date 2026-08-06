import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADMIN_URL, FRONTEND_URL, API_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from './config.js';
import { loginAsAdmin, fieldInput, uniqueSuffix } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_A = path.join(__dirname, '..', 'fixtures', 'image-a.webp');
const IMAGE_B = path.join(__dirname, '..', 'fixtures', 'image-b.webp');

test.describe.configure({ mode: 'serial' });

test.describe('Admin -> Frontend wiring: Sliders (home hero)', () => {
  const suffix = uniqueSuffix();
  const title = `E2E Slide Title ${suffix}`;
  const editedTitle = `E2E Edited Title ${suffix}`;
  let sliderId;
  let adminApiToken;

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const body = await r.json();
    adminApiToken = body.token || body.accessToken;
  });

  test.afterAll(async ({ request }) => {
    // Guaranteed cleanup regardless of pass/fail, so failed test runs never
    // leave orphaned test records behind in the shared database.
    if (sliderId && adminApiToken) {
      await request.delete(`${API_URL}/api/sliders/${sliderId}`, {
        headers: { Authorization: `Bearer ${adminApiToken}` },
      });
    }
  });

  test('create in admin appears on the live frontend hero', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto(`${ADMIN_URL}/sliders/new`);
    await fieldInput(page, 'Heading').fill(`E2E Heading ${suffix}`);
    await fieldInput(page, 'Title').fill(title);
    await fieldInput(page, 'Subtitle').fill('E2E subtitle text');
    await page.locator('input[type="file"]').first().setInputFiles(IMAGE_A);

    const [createResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/sliders') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /save|create/i }).click(),
    ]);
    const created = await createResponse.json();
    sliderId = created._id || created.id;
    expect(sliderId).toBeTruthy();

    await expect(page).toHaveURL(/\/sliders$/, { timeout: 10_000 });
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    // Public frontend: fresh navigation (SPA does not live-push; this confirms
    // whether a reload is required for the new record to show up).
    await page.goto(FRONTEND_URL);
    await expect(page.locator('h1', { hasText: title })).toBeAttached({ timeout: 10_000 });

    // The uploaded image must actually render (no broken link / 404).
    const img = page.locator('.swiper-slide img').first();
    await expect(img).toBeVisible();
  });

  test('editing the heading in admin is reflected on the frontend after reload', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/sliders/edit/${sliderId}`);

    const titleField = fieldInput(page, 'Title');
    await expect(titleField).toHaveValue(title, { timeout: 10_000 });
    await titleField.fill(editedTitle);
    await page.getByRole('button', { name: /save|update/i }).click();
    await expect(page).toHaveURL(/\/sliders$/, { timeout: 10_000 });

    await page.goto(FRONTEND_URL);
    await expect(page.locator('h1', { hasText: editedTitle })).toBeAttached({ timeout: 10_000 });
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });

  test('replacing the image swaps it on the frontend without a broken link', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/sliders/edit/${sliderId}`);

    await expect(fieldInput(page, 'Title')).toHaveValue(editedTitle, { timeout: 10_000 });
    const existingPreview = page.locator('img[alt="Slider preview"]');
    const oldSrc = await existingPreview.getAttribute('src');

    await page.locator('input[type="file"]').first().setInputFiles(IMAGE_B);
    await page.getByRole('button', { name: /save|update/i }).click();
    await expect(page).toHaveURL(/\/sliders$/, { timeout: 10_000 });

    await page.goto(FRONTEND_URL);
    const img = page.locator('.swiper-slide img').first();
    await expect(img).toBeVisible({ timeout: 10_000 });
    const newSrc = await img.getAttribute('src');
    expect(newSrc).not.toBe(oldSrc);

    // Confirm the rendered image URL actually resolves (no 404).
    const absoluteSrc = new URL(newSrc, FRONTEND_URL).toString();
    const resp = await page.request.get(absoluteSrc);
    expect(resp.status()).toBe(200);
  });

  test('deleting the slider removes it from the frontend', async ({ page, request }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/sliders`);

    const card = page.locator('article', { hasText: editedTitle });
    page.once('dialog', (dialog) => dialog.accept());
    await card.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText(editedTitle)).toHaveCount(0, { timeout: 10_000 });

    // Deleted through the UI already; mark so afterAll doesn't try again.
    const check = await request.get(`${API_URL}/api/sliders/${sliderId}`);
    expect(check.status()).toBe(404);
    sliderId = null;

    await page.goto(FRONTEND_URL);
    await expect(page.locator('h1', { hasText: editedTitle })).toHaveCount(0, { timeout: 10_000 });
  });
});
