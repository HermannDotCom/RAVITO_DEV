import { Page, expect } from '@playwright/test';

export class LandingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    // Wait for the page to load by checking for the hero heading
    await expect(
      this.page.getByRole('heading', { name: /La plateforme tout-en-un/i })
    ).toBeVisible({ timeout: 15000 });
  }

  async clickSeConnecter() {
    await this.page.getByRole('button', { name: /se connecter/i }).click();
  }

  async clickCreerCompte() {
    await this.page.getByRole('button', { name: /créer un compte/i }).first().click();
  }

  async verifyHeroSection() {
    await expect(this.page.locator('h1')).toContainText(/bars, maquis et restaurants/i);
  }
  
  async verifyInnovativeFeaturesSection() {
    await expect(this.page.getByRole('heading', { name: /Des outils puissants pour votre réussite/i })).toBeVisible();
    await expect(this.page.locator('text=/Gestion Activité/i').first()).toBeVisible();
    await expect(this.page.locator('text=/Carnet de Crédit/i').first()).toBeVisible();
    await expect(this.page.locator('text=/Tableaux de Bord/i').first()).toBeVisible();
  }

  async verifyValuePropositions() {
    await expect(this.page.locator('text=/livraison/i').first()).toBeVisible();
  }

  async goToCGU() {
    // CGU is a button in the footer
    await this.page.getByRole('button', { name: 'CGU' }).click();
  }

  async goToMentionsLegales() {
    // Mentions légales is a button in the footer
    await this.page.getByRole('button', { name: /Mentions légales/i }).click();
  }
}

export class AuthPage {
  constructor(private page: Page) {}

  async waitForLoginForm() {
    await expect(this.page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async expectLoggedIn() {
    await expect(
      this.page.locator('text=/dashboard|tableau de bord|catalogue|commandes/i')
    ).toBeVisible({ timeout: 20000 });
  }

  async expectError() {
    await expect(
      this.page.locator('text=/erreur|invalide|incorrect/i')
    ).toBeVisible({ timeout: 10000 });
  }
}
