import { expect } from '@playwright/test';
import { ADMIN_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from './config.js';

export async function loginAsAdmin(page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 10_000 });
}

export function fieldInput(page, labelText) {
  return page.locator(`label:text-is("${labelText}") + input`);
}

export function fieldTextarea(page, labelText) {
  return page.locator(`label:text-is("${labelText}") + textarea`);
}

export const uniqueSuffix = () => Date.now().toString(36);
