import { test, expect } from '@playwright/test';
import { LandingPage } from '../fixtures/page-objects';

test.describe('Landing Page', () => {
  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
  });

  test('devrait afficher la section héro avec le slogan', async ({ page }) => {
    await landing.goto();
    await landing.verifyHeroSection();
  });

  test('devrait afficher les propositions de valeur', async ({ page }) => {
    await landing.goto();
    await landing.verifyValuePropositions();
  });

  test('devrait naviguer vers le formulaire de connexion', async ({ page }) => {
    await landing.goto();
    await landing.clickSeConnecter();
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('devrait naviguer vers la page CGU', async ({ page }) => {
    await landing.goto();
    await landing.goToCGU();
    await expect(page.locator('text=Conditions Générales')).toBeVisible({ timeout: 10000 });
  });

  test('devrait naviguer vers les Mentions Légales', async ({ page }) => {
    await landing.goto();
    await landing.goToMentionsLegales();
    await expect(page.locator('text=Mentions Légales')).toBeVisible({ timeout: 10000 });
  });

  test('devrait être responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await landing.goto();
    await landing.verifyHeroSection();
  });
});
