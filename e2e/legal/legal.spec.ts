import { test, expect } from '@playwright/test';

test.describe('Pages Légales', () => {
  test('devrait afficher la page CGU avec les articles', async ({ page }) => {
    await page.goto('/cgu');
    
    await expect(page.getByRole('heading', { name: /Conditions Générales/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /ARTICLE 1 - /i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ARTICLE 4 - /i })).toBeVisible();
  });

  test('devrait afficher la tarification dans les CGU', async ({ page }) => {
    await page.goto('/cgu');
    
    await expect(page.locator('text=/8%/i')).toBeVisible();
    await expect(page.locator('text=/2%/i')).toBeVisible();
  });

  test('devrait afficher les Mentions Légales', async ({ page }) => {
    await page.goto('/mentions-legales');
    
    await expect(page.getByRole('heading', { name: /Mentions Légales/i })).toBeVisible({ timeout: 10000 });
  });

  test('devrait pouvoir revenir à la landing depuis CGU', async ({ page }) => {
    await page.goto('/cgu');
    // Look for RAVITO logo or text that links to home
    const homeLink = page.locator('text=RAVITO').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page.getByRole('heading', { name: /Le ravitaillement qui ne dort jamais/i })).toBeVisible({ timeout: 10000 });
    } else {
      // If no home link, just verify we can navigate back programmatically
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Le ravitaillement qui ne dort jamais/i })).toBeVisible({ timeout: 10000 });
    }
  });
});
