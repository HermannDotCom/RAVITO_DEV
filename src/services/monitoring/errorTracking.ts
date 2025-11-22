/**
 * Error Tracking Service
 * Integrates Sentry.io for comprehensive error tracking and monitoring
 */

import * as Sentry from '@sentry/react';

interface ErrorTrackingConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Initialize error tracking with Sentry
 */
export const initializeErrorTracking = (config: ErrorTrackingConfig) => {
  if (!config.dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    beforeSend(event) {
      // Filter out non-critical errors
      if (event.level === 'info' || event.level === 'debug') {
        return null;
      }
      return event;
    },
  });
};

/**
 * Capture an exception with context
 */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message with severity level
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  role?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

/**
 * Set custom tags for filtering
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, unknown>) => {
  Sentry.setContext(name, context);
};

/**
 * Wrap component with error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

export default {
  initializeErrorTracking,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  setTag,
  setContext,
  ErrorBoundary,
};
