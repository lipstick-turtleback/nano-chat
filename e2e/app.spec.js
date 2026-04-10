import { expect, test } from '@playwright/test';

test('app loads and shows chat interface', async ({ page }) => {
  await page.goto('/');

  // Should have the sidebar with companions heading
  await expect(page.getByText('Companions')).toBeVisible({ timeout: 10000 });
});

test('sidebar shows all companions', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });

  // Check all 5 companions are listed by shortName
  await expect(page.getByText('Aria')).toBeVisible();
  await expect(page.getByText('Kai')).toBeVisible();
  await expect(page.getByText('Nova')).toBeVisible();
  await expect(page.getByText('Sage')).toBeVisible();
  await expect(page.getByText('Pixel')).toBeVisible();
});

test('provider section is visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Provider')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('radio', { name: /chrome ai/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /ollama/i })).toBeVisible();
});

test('chat input is visible and interactive', async ({ page }) => {
  await page.goto('/');

  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await expect(textarea).toBeVisible({ timeout: 10000 });
  await expect(textarea).toBeEnabled();
});

test('selecting a different companion switches context', async ({ page }) => {
  await page.goto('/');

  await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });

  // Click on Kai companion radio
  await page.getByRole('radio', { name: /^kai$/i }).nth(0).click();

  // Chat should reinitialize
  await expect(page.getByText('Kai')).toBeVisible();
});

test('send button is disabled when input is empty', async ({ page }) => {
  await page.goto('/');

  await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });

  // Send button should be disabled
  const sendBtn = page.getByRole('button', { name: /send message/i });
  await expect(sendBtn).toBeDisabled();

  // Type something
  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await textarea.fill('Hello');

  // Send button should be enabled
  await expect(sendBtn).toBeEnabled();
});

test('character count updates as user types', async ({ page }) => {
  await page.goto('/');

  await page.locator('.sidebar').toBeVisible({ timeout: 10000 });

  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await textarea.fill('Hi');

  const charCount = page.locator('.char-count');
  await expect(charCount).toHaveText('2');

  await textarea.fill('Hello world');
  await expect(charCount).toHaveText('11');
});
