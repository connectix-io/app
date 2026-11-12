import { test, expect } from '@playwright/test';

// Conversations smoke — runs in CI (GitHub Actions and `make ci-local` via act)
// against the built app served by `vite preview`.
//
// Always: the login screen renders, the main screen is protected, bad
// credentials are refused. With E2E_EMAIL + E2E_PASSWORD (a confirmed Supabase
// user) and the event-store migration applied, it also signs in and drives the
// conversations table end to end.

const E2E_EMAIL = process.env.E2E_EMAIL || '';
const E2E_PASSWORD = process.env.E2E_PASSWORD || '';

const field = (page, id) => page.getByTestId(id).locator('input');

test.describe('conversations smoke', () => {
  // The first-visit tour covers the screen; these tests drive the inbox itself.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('inbox-tour-done', '1'));
  });

  test('login screen renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(field(page, 'email-input')).toBeVisible();
    await expect(field(page, 'password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeEnabled();
  });

  test('conversations is protected when signed out', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('bad credentials are refused with an error', async ({ page }) => {
    await page.goto('/login');
    await field(page, 'email-input').fill('nobody@example.invalid');
    await field(page, 'password-input').fill('definitely-wrong');
    await page.getByTestId('login-button').click();
    // Either Supabase refuses the login, or (no Supabase configured) the app says so.
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signed-in: create a conversation and see it in the inbox', async ({ page }) => {
    test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');

    await page.goto('/login');
    await field(page, 'email-input').fill(E2E_EMAIL);
    await field(page, 'password-input').fill(E2E_PASSWORD);
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/\/conversations$/, { timeout: 20_000 });
    await expect(page.getByTestId('conversations-list')).toBeVisible();

    // A unique customer per run (one customer = one thread, keyed by phone).
    const stamp = Date.now().toString().slice(-7);
    const name = `E2E ${stamp}`;
    await page.getByTestId('conversations-new').click();
    const form = page.getByTestId('new-conversation-form');
    await form.getByLabel(/Contact|איש קשר/).fill(name);
    await form.getByLabel(/Phone|טלפון/).fill(`050${stamp}`);
    await form.getByRole('button', { name: /Create|יצירה/ }).click();

    await expect(page.getByTestId('conversation-thread')).toBeVisible();
    await page.getByTestId('thread-input').locator('textarea').first().fill('hello from e2e');
    await page.getByTestId('thread-send').click();

    await expect(page.getByTestId('conversation-row').filter({ hasText: name })).toBeVisible({ timeout: 15_000 });
  });
});
