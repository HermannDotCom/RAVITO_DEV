// ============================================
// FEATURE FLAGS CONFIGURATION
// ============================================

/**
 * Feature flags pour contrôler l'affichage des modules de l'application
 *
 * Pour Ravito Gestion (système d'abonnement), certains modules sont masqués
 * car ils ne sont pas concernés par cette version de l'application.
 */

export interface FeatureFlags {
  // Modules principaux
  RAVITO_GESTION: boolean;          // Module "Gestion Activité" (payant)
  RAVITO_MARKETPLACE: boolean;       // Marketplace, Catalogue, Commandes
  SUBSCRIPTION_REQUIRED: boolean;    // Activer le système d'abonnement

  // Fonctionnalités spécifiques
  PRODUCT_CATALOG: boolean;          // Catalogue produits
  SHOPPING_CART: boolean;            // Panier
  ORDER_MANAGEMENT: boolean;         // Gestion des commandes
  CREDIT_SYSTEM: boolean;            // Système de crédit (onglet commandes)
  SUPPLIER_FEATURES: boolean;        // Fonctionnalités fournisseurs
  DELIVERY_MODE: boolean;            // Mode livreur
  TEAM_MANAGEMENT: boolean;          // Gestion d'équipe
  COMMERCIAL_ACTIVITY: boolean;      // Activité commerciale
}

/**
 * Configuration des feature flags
 *
 * IMPORTANT: Modifier ces valeurs pour activer/désactiver des fonctionnalités
 */
export const featureFlags: FeatureFlags = {
  // Pour Ravito Gestion, on garde uniquement le module de gestion
  RAVITO_GESTION: true,
  SUBSCRIPTION_REQUIRED: true,

  // On masque tout ce qui concerne le marketplace
  RAVITO_MARKETPLACE: false,
  PRODUCT_CATALOG: false,
  SHOPPING_CART: false,
  ORDER_MANAGEMENT: false,
  CREDIT_SYSTEM: false,
  SUPPLIER_FEATURES: false,
  DELIVERY_MODE: false,

  // On garde la gestion d'équipe et l'activité commerciale
  TEAM_MANAGEMENT: true,
  COMMERCIAL_ACTIVITY: true
};

/**
 * Vérifie si une fonctionnalité est activée
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature];
};

/**
 * Vérifie si le module Ravito Gestion est activé
 */
export const isRavitoGestionEnabled = (): boolean => {
  return featureFlags.RAVITO_GESTION;
};

/**
 * Vérifie si le système d'abonnement est requis
 */
export const isSubscriptionRequired = (): boolean => {
  return featureFlags.SUBSCRIPTION_REQUIRED;
};

/**
 * Vérifie si le marketplace est activé
 */
export const isMarketplaceEnabled = (): boolean => {
  return featureFlags.RAVITO_MARKETPLACE;
};

/**
 * Pages à masquer selon les feature flags
 */
export const getHiddenPages = (): string[] => {
  const hiddenPages: string[] = [];

  if (!featureFlags.PRODUCT_CATALOG) {
    hiddenPages.push('/catalog', '/products');
  }

  if (!featureFlags.SHOPPING_CART) {
    hiddenPages.push('/cart', '/panier');
  }

  if (!featureFlags.ORDER_MANAGEMENT) {
    hiddenPages.push('/orders', '/mes-commandes', '/history');
  }

  if (!featureFlags.SUPPLIER_FEATURES) {
    hiddenPages.push('/supplier', '/fournisseur');
  }

  if (!featureFlags.DELIVERY_MODE) {
    hiddenPages.push('/delivery', '/livraison');
  }

  if (!featureFlags.CREDIT_SYSTEM) {
    // Le système de crédit est dans l'onglet "Crédits" du module activité
    // On le masquera au niveau du composant
  }

  return hiddenPages;
};

/**
 * Routes visibles pour Ravito Gestion uniquement
 */
export const RAVITO_GESTION_ROUTES = [
  '/',
  '/login',
  '/register',
  '/profile',
  '/activity',
  '/subscribe',
  '/subscription',
  '/team',
  '/commercial-activity',
  '/settings',
  '/legal',
  '/cgu',
  '/cgv',
  '/privacy'
];

/**
 * Vérifie si une route est accessible selon les feature flags
 */
export const isRouteAccessible = (path: string): boolean => {
  const hiddenPages = getHiddenPages();

  // Vérifier si la route est dans les pages masquées
  if (hiddenPages.some(hidden => path.startsWith(hidden))) {
    return false;
  }

  // Si marketplace est désactivé, seules les routes Ravito Gestion sont accessibles
  if (!featureFlags.RAVITO_MARKETPLACE) {
    return RAVITO_GESTION_ROUTES.some(route =>
      path === route || path.startsWith(route)
    );
  }

  return true;
};

/**
 * Liste des modules disponibles selon les feature flags
 */
export const getAvailableModules = () => {
  const modules = [];

  if (featureFlags.RAVITO_GESTION) {
    modules.push({
      id: 'gestion',
      name: 'Gestion Activité',
      icon: '📊',
      requiresSubscription: featureFlags.SUBSCRIPTION_REQUIRED
    });
  }

  if (featureFlags.RAVITO_MARKETPLACE) {
    modules.push({
      id: 'marketplace',
      name: 'Marketplace',
      icon: '🛒',
      requiresSubscription: false
    });
  }

  if (featureFlags.TEAM_MANAGEMENT) {
    modules.push({
      id: 'team',
      name: 'Mon Équipe',
      icon: '👥',
      requiresSubscription: false
    });
  }

  if (featureFlags.COMMERCIAL_ACTIVITY) {
    modules.push({
      id: 'commercial',
      name: 'Activité Commerciale',
      icon: '💼',
      requiresSubscription: false
    });
  }

  return modules;
};
