import { test, expect } from '@playwright/test';

import { loginUser, registerUser, uniqueEmail } from './helpers';

const PASSWORD = 'Password123';



test.describe('Register', () => {
  test('happy path: register a customer and redirect to /tickets', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');

    await expect(page).toHaveURL('/tickets');
    await expect(page.getByText('Tickets', { exact: true })).toBeVisible();
  });

  test('error: empty name', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Name' }).fill('');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: invalid email', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText('Invalid email format')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: short password', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('abc');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText('At least 8 characters'),
    ).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('error: duplicate email', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'First User', email, PASSWORD, 'customer');
    await expect(page).toHaveURL('/tickets');

    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Name' }).fill('Second User');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText('already exists')).toBeVisible();
  });
});

test.describe('Login', () => {
  test('happy path: login and redirect to /tickets', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await expect(page).toHaveURL('/tickets');

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await loginUser(page, email, PASSWORD);
    await expect(page).toHaveURL('/tickets');
    await expect(page.getByText('Tickets', { exact: true })).toBeVisible();
  });

  test('error: wrong password', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await expect(page).toHaveURL('/tickets');

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    await loginUser(page, email, 'wrongpassword');
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('error: non-existent user', async ({ page }) => {
    await loginUser(page, uniqueEmail(), PASSWORD);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('error: empty field', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('');
    await page.getByRole('textbox', { name: 'Password' }).fill('abc');
    await page.click('button[type="submit"]');

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
    await expect(page).toHaveURL('/tickets');

    await page.goto('/login');
    await expect(page).toHaveURL('/tickets');
  });
});

test.describe('Nav logout button', () => {
  test('login then logout clears session', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, PASSWORD, 'customer');
    await expect(page).toHaveURL('/tickets');

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});
