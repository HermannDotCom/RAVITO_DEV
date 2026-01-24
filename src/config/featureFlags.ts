/**
 * Feature Flags pour la migration progressive
 * Permet de revenir à l'ancien comportement si problème détecté
 */

export const FEATURE_FLAGS = {
  /**
   * Si true : utilise products comme source des prix de référence
   * Si false : utilise reference_prices (ancien comportement)
   */
  USE_PRODUCTS_AS_REFERENCE_SOURCE: true,

  /**
   * Si true : utilise le nouveau AdminCatalogDashboard
   * Si false : utilise l'ancien ProductManagement
   */
  USE_NEW_CATALOG_DASHBOARD: true,

  /**
   * Si true : active le realtime sur products
   * Si false : garde le realtime sur reference_prices
   */
  USE_PRODUCTS_REALTIME: true,
};

/**
 * Helper pour vérifier un feature flag
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
