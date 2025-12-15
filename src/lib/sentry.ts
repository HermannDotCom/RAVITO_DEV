import * as Sentry from '@sentry/react';

// Configuration Sentry
export const initSentry = () => {
  // Ne pas initialiser en développement local sans DSN
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Capture 10% des sessions en replay
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance : capturer 20% des transactions en prod, 100% en dev
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
    
    // Session Replay : 10% des sessions, 100% si erreur
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filtrer les erreurs non pertinentes
    ignoreErrors: [
      // Erreurs réseau communes
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      // Erreurs de navigateur
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Extensions navigateur
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
    
    // Avant d'envoyer l'événement
    beforeSend(event, hint) {
      // Ajouter des informations contextuelles
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        // Log local pour debug
        console.error('[Sentry] Capturing error:', (error as Error).message);
      }
      
      return event;
    },
    
    // Avant d'envoyer une breadcrumb
    beforeBreadcrumb(breadcrumb) {
      // Filtrer les breadcrumbs de console.log en prod
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
  });

  console.log('[Sentry] Initialized successfully');
};

// Fonction pour capturer une erreur manuellement
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Fonction pour capturer un message
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Fonction pour définir l'utilisateur courant
export const setUser = (user: { id: string; email?: string; role?: string } | null) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Fonction pour ajouter un tag
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

// Fonction pour ajouter du contexte
export const setContext = (name: string, context: Record<string, unknown>) => {
  Sentry.setContext(name, context);
};

// Fonction pour créer une transaction de performance
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op });
};

// Export Sentry pour usage direct si nécessaire
export { Sentry };
