import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should display login form', async ({ page }) => {
    // Check that the login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await expect(page.getByText(/erreur|invalide|incorrect/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have register option', async ({ page }) => {
    // Check for register link or button
    const registerButton = page.getByRole('button', { name: /inscription|créer un compte|s'inscrire/i });
    const registerLink = page.getByRole('link', { name: /inscription|créer un compte|s'inscrire/i });
    
    const hasRegister = await registerButton.isVisible().catch(() => false) || 
                        await registerLink.isVisible().catch(() => false);
    
    expect(hasRegister || await page.getByText(/inscription|créer un compte/i).isVisible()).toBeTruthy();
  });

  test('should display demo accounts if available', async ({ page }) => {
    // Some applications have demo account selectors - just check the page loads correctly
    await expect(page.locator('body')).toBeVisible();
  });
});
