/**
 * E2E Test: Client Order Flow
 * Critical user journey: Browse → Order → Payment → Tracking
 */

import { test, expect } from '@playwright/test';

test.describe('Client Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete full order flow', async ({ page }) => {
    // Step 1: Login as client
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client1@test.ci');
    await page.fill('input[type="password"]', 'Client@2025!');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard Client')).toBeVisible({ timeout: 10000 });

    // Step 2: Browse products
    await page.click('text=Produits');
    await expect(page.locator('text=Catalogue')).toBeVisible();

    // Step 3: Search for a product
    await page.fill('input[placeholder*="Rechercher"]', 'Heineken');
    await page.waitForTimeout(1000); // Wait for debounce

    // Step 4: Add product to cart
    const productCard = page.locator('text=Heineken').first();
    await expect(productCard).toBeVisible();
    await page.click('button:has-text("Ajouter au panier")');

    // Verify cart updated
    await expect(page.locator('text=Panier').locator('span')).toContainText('1');

    // Step 5: Go to cart
    await page.click('text=Panier');
    await expect(page.locator('text=Votre Panier')).toBeVisible();

    // Step 6: Proceed to checkout
    await page.click('button:has-text("Commander")');
    await expect(page.locator('text=Confirmation')).toBeVisible();

    // Step 7: Select payment method
    await page.click('text=Orange Money');

    // Step 8: Confirm order
    await page.click('button:has-text("Confirmer")');

    // Step 9: Verify order created
    await expect(page.locator('text=Commande créée')).toBeVisible({ timeout: 5000 });

    // Step 10: Check order tracking
    await page.click('text=Mes Commandes');
    await expect(page.locator('text=En attente')).toBeVisible();
  });

  test('should show validation errors for empty cart', async ({ page }) => {
    // Login
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client1@test.ci');
    await page.fill('input[type="password"]', 'Client@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Client')).toBeVisible({ timeout: 10000 });

    // Try to checkout with empty cart
    await page.click('text=Panier');
    await expect(page.locator('text=Votre panier est vide')).toBeVisible();
  });

  test('should handle product search correctly', async ({ page }) => {
    // Login
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client1@test.ci');
    await page.fill('input[type="password"]', 'Client@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Client')).toBeVisible({ timeout: 10000 });

    // Test search functionality
    await page.click('text=Produits');
    await page.fill('input[placeholder*="Rechercher"]', 'NonExistentProduct123');
    await page.waitForTimeout(1000);

    // Should show no results
    await expect(page.locator('text=Aucun produit trouvé')).toBeVisible();
  });

  test('should calculate cart total correctly', async ({ page }) => {
    // Login
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client1@test.ci');
    await page.fill('input[type="password"]', 'Client@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Client')).toBeVisible({ timeout: 10000 });

    // Add multiple items
    await page.click('text=Produits');
    
    // Add first product
    await page.click('button:has-text("Ajouter au panier")');
    await page.waitForTimeout(500);

    // Add second product
    const addButtons = await page.locator('button:has-text("Ajouter au panier")').all();
    if (addButtons.length > 1) {
      await addButtons[1].click();
    }

    // Check cart
    await page.click('text=Panier');
    
    // Verify total is calculated
    await expect(page.locator('text=Total')).toBeVisible();
    const totalText = await page.locator('text=Total').textContent();
    expect(totalText).toContain('FCFA');
  });
});

test.describe('Performance Monitoring', () => {
  test('should load client dashboard within performance threshold', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client1@test.ci');
    await page.fill('input[type="password"]', 'Client@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Client')).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });
});
