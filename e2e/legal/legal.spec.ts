import { test, expect } from '@playwright/test';

test.describe('Pages Légales', () => {
  test('devrait afficher la page CGU avec les articles', async ({ page }) => {
    await page.goto('/cgu');
    
    await expect(page.locator('text=Conditions Générales')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Article 1/i')).toBeVisible();
    await expect(page.locator('text=/Article 4/i')).toBeVisible();
  });

  test('devrait afficher la tarification dans les CGU', async ({ page }) => {
    await page.goto('/cgu');
    
    await expect(page.locator('text=/8%/i')).toBeVisible();
    await expect(page.locator('text=/2%/i')).toBeVisible();
  });

  test('devrait afficher les Mentions Légales', async ({ page }) => {
    await page.goto('/mentions-legales');
    
    await expect(page.locator('text=Mentions Légales')).toBeVisible({ timeout: 10000 });
  });

  test('devrait pouvoir revenir à la landing depuis CGU', async ({ page }) => {
    await page.goto('/cgu');
    await page.click('a[href="/"], text=RAVITO, .logo');
    
    await expect(page.locator('text=Le ravitaillement qui ne dort jamais')).toBeVisible({ timeout: 10000 });
  });
});
