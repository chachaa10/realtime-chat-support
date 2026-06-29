import { test, expect } from '@playwright/test';

import { loginUser, registerUser, uniqueEmail } from './helpers';

const PASSWORD = 'password123';

test.describe('Register', () => {
  test('happy path: register a customer and redirect to /tickets', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');

    await page.waitForURL('**/tickets');
    await expect(page.locator('h1')).toHaveText('Tickets');
  });

  test('error: empty name', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.fill('input[placeholder="Name"]', '');
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=expected string to have >=1 characters')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: invalid email', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[placeholder="Name"]', 'Test User');
    await page.fill('input[placeholder="Email"]', 'not-an-email');
    await page.fill('input[placeholder="Password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: short password', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.fill('input[placeholder="Name"]', 'Test User');
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', 'abc');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=expected string to have >=8 characters'),
    ).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: duplicate email', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'First User', email, PASSWORD, 'customer');
    await page.waitForURL('**/tickets');

    await page.goto('/register');
    await page.fill('input[placeholder="Name"]', 'Second User');
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=already exists')).toBeVisible();
  });
});

test.describe('Login', () => {
  test('happy path: login and redirect to /tickets', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await page.waitForURL('**/tickets');

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await loginUser(page, email, PASSWORD);
    await page.waitForURL('**/tickets');
    await expect(page.locator('h1')).toHaveText('Tickets');
  });

  test('error: wrong password', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await page.waitForURL('**/tickets');

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await loginUser(page, email, 'wrongpassword');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('error: non-existent user', async ({ page }) => {
    await loginUser(page, uniqueEmail(), PASSWORD);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('error: empty email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', '');
    await page.fill('input[placeholder="Password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Auth guard', () => {
  test('redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL('/login');
  });

  test('redirect authenticated users away from /login', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await page.waitForURL('**/tickets');

    await page.goto('/login');
    await expect(page).toHaveURL('/tickets');
  });
});

test.describe('Nav logout button', () => {
  test('login then logout clears session', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await page.waitForURL('**/tickets');

    await page.click('button:has-text("Logout")');
    await expect(page.locator('text=Login')).toBeVisible();
  });
});
