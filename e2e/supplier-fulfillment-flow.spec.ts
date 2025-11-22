/**
 * E2E Test: Supplier Fulfillment Flow
 * Critical user journey: See order → Make offer → Accept → Deliver
 */

import { test, expect } from '@playwright/test';

test.describe('Supplier Fulfillment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle order fulfillment process', async ({ page }) => {
    // Step 1: Login as supplier
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'supplier1@test.ci');
    await page.fill('input[type="password"]', 'Supplier@2025!');
    await page.click('button[type="submit"]');

    // Wait for supplier dashboard
    await expect(page.locator('text=Dashboard Fournisseur')).toBeVisible({ timeout: 10000 });

    // Step 2: Check available orders
    await page.click('text=Commandes Disponibles');
    await expect(page.locator('text=Commandes')).toBeVisible();

    // Step 3: View order details
    const orderCards = await page.locator('[data-testid="order-card"]').count();
    
    if (orderCards > 0) {
      await page.locator('[data-testid="order-card"]').first().click();
      await expect(page.locator('text=Détails de la commande')).toBeVisible();

      // Step 4: Make an offer (if not already made)
      const makeOfferButton = page.locator('button:has-text("Faire une offre")');
      if (await makeOfferButton.isVisible()) {
        await makeOfferButton.click();
        await page.fill('input[name="delivery_time"]', '30');
        await page.click('button:has-text("Soumettre l\'offre")');
        await expect(page.locator('text=Offre envoyée')).toBeVisible();
      }
    }

    // Step 5: Check my orders
    await page.click('text=Mes Commandes');
    await expect(page.locator('text=Commandes en cours')).toBeVisible();
  });

  test('should display order metrics', async ({ page }) => {
    // Login as supplier
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'supplier1@test.ci');
    await page.fill('input[type="password"]', 'Supplier@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Fournisseur')).toBeVisible({ timeout: 10000 });

    // Check metrics display
    await expect(page.locator('text=Commandes totales')).toBeVisible();
    await expect(page.locator('text=Revenu')).toBeVisible();
    await expect(page.locator('text=Note moyenne')).toBeVisible();
  });

  test('should update order status', async ({ page }) => {
    // Login as supplier
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'supplier1@test.ci');
    await page.fill('input[type="password"]', 'Supplier@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Fournisseur')).toBeVisible({ timeout: 10000 });

    // Navigate to active orders
    await page.click('text=Mes Commandes');
    
    const activeOrders = await page.locator('[data-testid="active-order"]').count();
    
    if (activeOrders > 0) {
      // Click on first active order
      await page.locator('[data-testid="active-order"]').first().click();
      
      // Update status
      const statusButtons = page.locator('button[data-testid="status-update"]');
      if (await statusButtons.count() > 0) {
        await statusButtons.first().click();
        await expect(page.locator('text=Statut mis à jour')).toBeVisible();
      }
    }
  });

  test('should calculate delivery time correctly', async ({ page }) => {
    // Login as supplier
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'supplier1@test.ci');
    await page.fill('input[type="password"]', 'Supplier@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Fournisseur')).toBeVisible({ timeout: 10000 });

    await page.click('text=Commandes Disponibles');
    
    const orderCards = await page.locator('[data-testid="order-card"]').count();
    
    if (orderCards > 0) {
      await page.locator('[data-testid="order-card"]').first().click();
      
      // Check if make offer button exists
      const makeOfferButton = page.locator('button:has-text("Faire une offre")');
      if (await makeOfferButton.isVisible()) {
        await makeOfferButton.click();
        
        // Enter negative delivery time (should show error)
        await page.fill('input[name="delivery_time"]', '-10');
        await page.click('button:has-text("Soumettre l\'offre")');
        await expect(page.locator('text=temps de livraison')).toBeVisible();
        
        // Enter valid delivery time
        await page.fill('input[name="delivery_time"]', '45');
        await page.click('button:has-text("Soumettre l\'offre")');
      }
    }
  });
});

test.describe('Supplier Performance', () => {
  test('should measure response time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'supplier1@test.ci');
    await page.fill('input[type="password"]', 'Supplier@2025!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard Fournisseur')).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Supplier dashboard loaded in ${loadTime}ms`);
  });
});
