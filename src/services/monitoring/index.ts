/**
 * Monitoring Initialization
 * Central initialization for all monitoring services
 */

import { initializeErrorTracking } from './errorTracking';
import { performanceMonitoring } from './performanceMonitoring';
import { logger } from './logger';
import { alertManager } from './alertManager';

export interface MonitoringConfig {
  sentry?: {
    dsn?: string;
    environment: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  performanceTracking?: boolean;
  businessMetrics?: boolean;
}

/**
 * Initialize all monitoring services
 */
export const initializeMonitoring = (config: MonitoringConfig) => {
  logger.info('Initializing monitoring services', { config });

  // Initialize error tracking
  if (config.sentry) {
    initializeErrorTracking(config.sentry);
    logger.info('Error tracking initialized');
  }

  // Initialize performance monitoring
  if (config.performanceTracking !== false) {
    performanceMonitoring.initialize((report) => {
      logger.info('Performance report generated', { report });

      // Check performance thresholds
      const uxScore = performanceMonitoring.calculateUXScore();
      if (uxScore < 50) {
        alertManager.createAlert({
          severity: 'P2',
          title: 'Poor User Experience Score',
          message: `UX Score is ${uxScore}/100. Performance needs improvement.`,
          context: { report },
        });
      }

      // Check individual metrics
      if (report.metrics.LCP && report.metrics.LCP > 2500) {
        alertManager.checkMetric('lcp', report.metrics.LCP);
      }
      if (report.metrics.FID && report.metrics.FID > 100) {
        alertManager.checkMetric('fid', report.metrics.FID);
      }
      if (report.metrics.CLS && report.metrics.CLS > 0.1) {
        alertManager.checkMetric('cls', report.metrics.CLS);
      }
    });
    logger.info('Performance monitoring initialized');
  }

  // Set up periodic health checks
  setupHealthChecks();

  logger.info('All monitoring services initialized successfully');
};

/**
 * Set up periodic health checks
 */
const setupHealthChecks = () => {
  // Check every 5 minutes
  setInterval(() => {
    performHealthCheck();
  }, 5 * 60 * 1000);

  // Initial check
  performHealthCheck();
};

/**
 * Perform health check
 */
const performHealthCheck = async () => {
  try {
    logger.debug('Performing health check');

    // Check if we have any critical active alerts
    const activeAlerts = alertManager.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === 'P0' || a.severity === 'P1'
    );

    if (criticalAlerts.length > 0) {
      logger.warn('Critical alerts detected', {
        count: criticalAlerts.length,
        alerts: criticalAlerts.map((a) => ({
          severity: a.severity,
          title: a.title,
        })),
      });
    }

    // Log overall system health
    const metrics = performanceMonitoring.getMetrics();
    logger.info('System health check completed', {
      performanceMetrics: metrics,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
  }
};

/**
 * Get monitoring status
 */
export const getMonitoringStatus = () => {
  return {
    errorTracking: {
      enabled: true,
      provider: 'sentry',
    },
    performanceMonitoring: {
      enabled: true,
      metrics: performanceMonitoring.getMetrics(),
      uxScore: performanceMonitoring.calculateUXScore(),
      rating: performanceMonitoring.getPerformanceRating(),
    },
    alerts: {
      active: alertManager.getActiveAlerts().length,
      statistics: alertManager.getStatistics(),
    },
  };
};

export default {
  initializeMonitoring,
  getMonitoringStatus,
};
