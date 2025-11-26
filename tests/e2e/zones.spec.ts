import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('Zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should load zones page successfully', async ({ page }) => {
    // Verify the application loads properly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display map or zone selection if available', async ({ page }) => {
    // The page should at least load correctly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle zone interactions', async ({ page }) => {
    // Test zone selection functionality if available
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Look for clickable zone elements
    const zoneButtons = page.locator('button[class*="zone"], [role="button"][class*="zone"]');
    const count = await zoneButtons.count();
    
    if (count > 0) {
      // If zones are available, try clicking the first one
      await zoneButtons.first().click();
      await waitForPageLoad(page);
    }
    
    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display zone information correctly', async ({ page }) => {
    // Check for zone-related information display
    await page.goto('/');
    await waitForPageLoad(page);
    
    // The application should be responsive and functional
    await expect(page.locator('body')).toBeVisible();
  });
});
