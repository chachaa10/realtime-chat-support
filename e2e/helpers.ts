import type { Page } from '@playwright/test';

export async function clearState(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
}

export function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'agent' = 'customer',
) {
  await page.goto('/register');
  await clearState(page);
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  if (role === 'agent') {
    await page.selectOption('select', 'agent');
  }
  await page.click('button[type="submit"]');
}

export async function loginUser(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto('/login');
  await clearState(page);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.click('button[type="submit"]');
}
