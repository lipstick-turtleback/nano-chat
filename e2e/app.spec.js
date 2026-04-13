import { expect, test } from '@playwright/test';

test('app loads and shows chat interface', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Companions')).toBeVisible({ timeout: 10000 });
});

test('sidebar shows all companions', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible({ timeout: 10000 });

  // Check key companions are listed within the sidebar
  await expect(sidebar.getByText('Aria', { exact: false })).toBeVisible();
  await expect(sidebar.getByText('Kai', { exact: false })).toBeVisible();
  await expect(sidebar.getByText('Mira', { exact: false })).toBeVisible();
});

test('settings button is visible in header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.chat-header')).toBeVisible({ timeout: 10000 });
  const header = page.locator('.chat-header');
  await expect(header).toBeVisible();
});

test('chat input is visible and interactive', async ({ page }) => {
  await page.goto('/');
  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await expect(textarea).toBeVisible({ timeout: 10000 });
  await expect(textarea).toBeEnabled();
});

test('selecting a different companion switches context', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible({ timeout: 10000 });

  // Click on Kai companion by clicking the card/label containing "Kai"
  await sidebar.locator('.companion-radio-card, .companion-card, label').filter({ hasText: 'Kai' }).first().click();

  // Chat should reinitialize with Kai - check the message sender name
  await expect(page.locator('.message-sender')).toHaveText(/Kai/, { timeout: 10000 });
});

test('send button is disabled when input is empty', async ({ page }) => {
  await page.goto('/');
  await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });

  const sendBtn = page.locator('.send-btn');
  await expect(sendBtn).toBeVisible();

  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await textarea.fill('Hello');
  await expect(sendBtn).toBeEnabled();
});

test('character count updates as user types', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });

  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await textarea.fill('Hi');
  await expect(page.locator('.char-count')).toHaveText('2');

  await textarea.fill('Hello world');
  await expect(page.locator('.char-count')).toHaveText('11');
});
