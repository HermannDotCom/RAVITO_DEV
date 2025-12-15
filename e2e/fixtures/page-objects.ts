import { Page, expect } from '@playwright/test';

export class LandingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await expect(
      this.page.locator('text=Le ravitaillement qui ne dort jamais')
    ).toBeVisible({ timeout: 15000 });
  }

  async clickSeConnecter() {
    await this.page.getByRole('button', { name: /se connecter/i }).click();
  }

  async clickCreerCompte() {
    await this.page.getByRole('button', { name: /créer un compte/i }).first().click();
  }

  async verifyHeroSection() {
    await expect(this.page.locator('h1')).toContainText(/ravitaillement/i);
  }

  async verifyValuePropositions() {
    await expect(this.page.locator('text=/livraison/i').first()).toBeVisible();
  }

  async goToCGU() {
    await this.page.click('a:has-text("CGU"), a:has-text("Conditions")');
  }

  async goToMentionsLegales() {
    await this.page.click('a:has-text("Mentions légales")');
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
