import { test, expect } from '@playwright/test';
import { LandingPage, AuthPage } from '../fixtures/page-objects';

test.describe('Authentification', () => {
  let landing: LandingPage;
  let auth: AuthPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    auth = new AuthPage(page);
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await landing.goto();
    await landing.clickSeConnecter();
    await auth.waitForLoginForm();
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('devrait afficher une erreur pour identifiants invalides', async ({ page }) => {
    await landing.goto();
    await landing.clickSeConnecter();
    await auth.waitForLoginForm();
    
    await auth.login('invalide@example.com', 'mauvais_mdp');
    await auth.expectError();
  });

  test('devrait permettre de basculer vers inscription', async ({ page }) => {
    await landing.goto();
    await landing.clickSeConnecter();
    await auth.waitForLoginForm();
    
    const registerLink = page.locator('text=/pas.*compte|inscription|créer.*compte/i').first();
    await expect(registerLink).toBeVisible({ timeout: 5000 });
  });
});
