import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for E2E tests
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Login with provided credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await waitForPageLoad(page);
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Déconnexion")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await waitForPageLoad(page);
  }
}

/**
 * Navigate to a specific page and wait for load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check if element with text exists
 */
export async function expectTextToBeVisible(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
  }
}
