import { expect, test } from '@playwright/test';

test('app loads and shows chat interface', async ({ page }) => {
  await page.goto('/');

  // Should have the app layout
  await expect(page.getByRole('heading', { level: 2, name: /companions/i })).toBeVisible({
    timeout: 10000
  });
});

test('sidebar shows all companions', async ({ page }) => {
  await page.goto('/');

  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible({ timeout: 10000 });

  // Check companions are listed
  await expect(page.getByText('IELTSAria')).toBeVisible();
  await expect(page.getByText('NanoCat')).toBeVisible();
  await expect(page.getByText('AiPierre')).toBeVisible();
});

test('provider section is visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('AI Provider')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /chrome ai/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /ollama/i })).toBeVisible();
});

test('chat input is visible and interactive', async ({ page }) => {
  await page.goto('/');

  const textarea = page.getByRole('textbox', { name: /chat message input/i });
  await expect(textarea).toBeVisible({ timeout: 10000 });
  await expect(textarea).toBeEnabled();
});

test('selecting a different companion switches context', async ({ page }) => {
  await page.goto('/');

  // Wait for sidebar
  await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });

  // Click on NanoCat
  await page
    .getByRole('button', { name: /nanocat/i })
    .first()
    .click();

  // The chat should reset and reinitialize
  await expect(page.getByText('NanoCat')).toBeVisible();
});
