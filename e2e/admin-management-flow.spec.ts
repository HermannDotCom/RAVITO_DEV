/**
 * E2E Test: Admin Management Flow
 * Critical user journey: Approve user → View analytics → Manage commission
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should access admin dashboard', async ({ page }) => {
    // Step 1: Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    // Wait for admin dashboard
    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Verify admin sections are visible
    await expect(page.locator('text=Utilisateurs')).toBeVisible();
    await expect(page.locator('text=Commandes')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should view and manage users', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to users
    await page.click('text=Utilisateurs');
    await expect(page.locator('text=Gestion des Utilisateurs')).toBeVisible();

    // Check filters
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to analytics
    await page.click('text=Analytics');
    await expect(page.locator('text=Statistiques')).toBeVisible();

    // Check key metrics are displayed
    await expect(page.locator('text=Revenus')).toBeVisible();
    await expect(page.locator('text=Commandes')).toBeVisible();
  });

  test('should manage commission settings', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to settings
    await page.click('text=Paramètres');
    await expect(page.locator('text=Commission')).toBeVisible();

    // Check commission percentage is displayed
    const commissionInput = page.locator('input[name="commission_percentage"]');
    if (await commissionInput.isVisible()) {
      const currentValue = await commissionInput.inputValue();
      expect(parseFloat(currentValue)).toBeGreaterThan(0);
    }
  });

  test('should view order management', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to orders
    await page.click('text=Commandes');
    await expect(page.locator('text=Gestion des Commandes')).toBeVisible();

    // Check order list
    const orders = await page.locator('[data-testid="order-row"]').count();
    console.log(`Found ${orders} orders in admin view`);
  });

  test('should export data', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to analytics or orders
    await page.click('text=Analytics');

    // Look for export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      // Check export options
      await exportButton.click();
      await expect(page.locator('text=CSV')).toBeVisible();
    }
  });
});

test.describe('Admin Performance', () => {
  test('should load admin dashboard quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Admin dashboard loaded in ${loadTime}ms`);
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    // Login as admin
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'admin@distri-night.ci');
    await page.fill('input[type="password"]', 'Admin@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Admin')).toBeVisible({ timeout: 10000 });

    // Navigate to orders (potentially large dataset)
    const startTime = Date.now();
    await page.click('text=Commandes');
    await expect(page.locator('text=Gestion des Commandes')).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`Orders list loaded in ${loadTime}ms`);
  });
});
