import { test, expect } from '@playwright/test';

test.describe('PWA', () => {
  test('devrait avoir un manifest.json valide', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest.name).toContain('RAVITO');
    expect(manifest.short_name).toBe('RAVITO');
    expect(manifest.theme_color).toBe('#F97316');
    expect(manifest.display).toBe('standalone');
  });

  test('devrait enregistrer le Service Worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('devrait avoir une page offline', async ({ page }) => {
    const response = await page.goto('/offline.html');
    expect(response?.status()).toBe(200);
  });

  test('devrait avoir les meta tags PWA', async ({ page }) => {
    await page.goto('/');
    
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBe('#F97316');
  });
});
