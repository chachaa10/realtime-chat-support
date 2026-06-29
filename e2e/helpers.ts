import type { Page } from '@playwright/test';

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
  await page.fill('input[placeholder="Name"]', name);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
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
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('button[type="submit"]');
}
