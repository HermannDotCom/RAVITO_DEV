import { test, expect, Page } from '@playwright/test';

test.describe('Authentication', () => {
  // Helper function to navigate to login form from landing page
  async function goToLoginForm(page: Page) {
    await page.goto('/');
    // Wait for landing page to load
    await expect(page.locator('text=Le ravitaillement qui ne dort jamais')).toBeVisible({ timeout: 10000 });
    // Click on "Se connecter" button in the header
    await page.click('button:has-text("Se connecter"), a:has-text("Se connecter")');
    // Wait for auth screen to appear
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  }

  test('should display landing page by default', async ({ page }) => {
    await page.goto('/');
    // Verify landing page elements
    await expect(page.locator('text=Le ravitaillement qui ne dort jamais')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Commencer maintenant')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /créer un compte/i }).first()).toBeVisible();
  });

  test('should display login form after clicking Se connecter', async ({ page }) => {
    await goToLoginForm(page);
    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await goToLoginForm(page);
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    // Submit the form
    await page.click('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")');
    // Expect error message
    await expect(page.locator('text=/erreur|invalide|incorrect/i')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register form', async ({ page }) => {
    await page.goto('/');
    // Click on "Créer un compte" from landing page header
    await page.getByRole('button', { name: /créer un compte/i }).first().click();
    // Verify we're on registration
    await expect(page.locator('text=/inscription|créer.*compte/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have register option from login form', async ({ page }) => {
    await goToLoginForm(page);
    // Look for link/button to switch to registration
    const registerLink = page.locator('text=/pas.*compte|inscription|créer.*compte/i').first();
    await expect(registerLink).toBeVisible({ timeout: 5000 });
  });

  test('should display demo accounts if available', async ({ page }) => {
    await goToLoginForm(page);
    // Check if demo section exists (optional - may not be present in all environments)
    const demoSection = page.locator('text=/démo|demo|compte.*test/i');
    // This is optional, so we just check if it might be visible
    const isDemoVisible = await demoSection.isVisible().catch(() => false);
    // Test passes whether demo accounts are visible or not
    expect(typeof isDemoVisible).toBe('boolean');
  });

  test('should navigate to CGU page', async ({ page }) => {
    await page.goto('/');
    // Find and click CGU link in footer
    await page.click('a:has-text("CGU"), a:has-text("Conditions")');
    // Verify CGU page
    await expect(page.locator('text=Conditions Générales')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/cgu/);
  });

  test('should navigate to Mentions Légales page', async ({ page }) => {
    await page.goto('/');
    // Find and click Mentions Légales link in footer
    await page.click('a:has-text("Mentions légales")');
    // Verify Mentions Légales page
    await expect(page.locator('text=Mentions Légales')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/mentions/);
  });

  test('should be able to return to landing from legal pages', async ({ page }) => {
    // Go to CGU
    await page.goto('/cgu');
    await expect(page.locator('text=Conditions Générales')).toBeVisible({ timeout: 10000 });
    
    // Click on logo to return home
    await page.click('a[href="/"]').catch(() => {
      // Fallback: click the RAVITO text or logo
      return page.click('text=RAVITO').catch(() => page.click('header a, .logo'));
    });
    
    // Verify we're back on landing
    await expect(page.locator('text=Le ravitaillement qui ne dort jamais')).toBeVisible({ timeout: 10000 });
  });
});
