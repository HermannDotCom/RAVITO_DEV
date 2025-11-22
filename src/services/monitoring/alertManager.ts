/**
 * Alert Management Service
 * Handles alert thresholds, routing, and notifications
 */

import { logger } from './logger';

export type AlertSeverity = 'P0' | 'P1' | 'P2' | 'P3';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface AlertThreshold {
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  value: number;
  severity: AlertSeverity;
  message: string;
}

class AlertManager {
  private alerts: Alert[] = [];
  private thresholds: AlertThreshold[] = [
    // P0 Critical Alerts
    {
      metric: 'error_rate',
      condition: 'gt',
      value: 2,
      severity: 'P0',
      message: 'Critical: Error rate exceeds 2%',
    },
    {
      metric: 'payment_success_rate',
      condition: 'lt',
      value: 99,
      severity: 'P0',
      message: 'Critical: Payment success rate below 99%',
    },
    // P1 High Alerts
    {
      metric: 'error_rate',
      condition: 'gt',
      value: 1,
      severity: 'P1',
      message: 'High: Error rate exceeds 1%',
    },
    {
      metric: 'p95_latency',
      condition: 'gt',
      value: 500,
      severity: 'P1',
      message: 'High: P95 latency exceeds 500ms',
    },
    {
      metric: 'page_load_time',
      condition: 'gt',
      value: 3000,
      severity: 'P1',
      message: 'High: Page load time exceeds 3 seconds',
    },
    // P2 Medium Alerts
    {
      metric: 'db_connection_pool',
      condition: 'gt',
      value: 80,
      severity: 'P2',
      message: 'Medium: Database connection pool usage exceeds 80%',
    },
    {
      metric: 'cache_hit_rate',
      condition: 'lt',
      value: 70,
      severity: 'P2',
      message: 'Medium: Cache hit rate below 70%',
    },
  ];

  /**
   * Check metric against thresholds
   */
  checkMetric(metric: string, value: number) {
    const relevantThresholds = this.thresholds.filter((t) => t.metric === metric);

    for (const threshold of relevantThresholds) {
      let triggered = false;

      switch (threshold.condition) {
        case 'gt':
          triggered = value > threshold.value;
          break;
        case 'lt':
          triggered = value < threshold.value;
          break;
        case 'eq':
          triggered = value === threshold.value;
          break;
      }

      if (triggered) {
        this.createAlert({
          severity: threshold.severity,
          title: `${threshold.severity}: ${metric} threshold exceeded`,
          message: threshold.message,
          context: { metric, value, threshold: threshold.value },
        });
      }
    }
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'status' | 'timestamp'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      status: 'active',
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(newAlert);

    // Log alert
    const logLevel = alert.severity === 'P0' || alert.severity === 'P1' ? 'critical' : 'warn';
    logger[logLevel](alert.message, alert.context);

    // Send notification based on severity
    this.sendNotification(newAlert);

    return newAlert;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send alert notification
   */
  private async sendNotification(alert: Alert) {
    try {
      // In production, send to Slack, email, or paging system
      if (import.meta.env.PROD) {
        const endpoint = this.getNotificationEndpoint(alert.severity);
        
        // Example: Slack webhook
        // await fetch(endpoint, {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     severity: alert.severity,
        //     title: alert.title,
        //     message: alert.message,
        //     timestamp: alert.timestamp,
        //   }),
        // });
      }
    } catch (error) {
      logger.error('Failed to send alert notification', error as Error);
    }
  }

  /**
   * Get notification endpoint based on severity
   */
  private getNotificationEndpoint(severity: AlertSeverity): string {
    switch (severity) {
      case 'P0':
        return '/api/alerts/pager'; // Page on-call person
      case 'P1':
        return '/api/alerts/slack-critical';
      case 'P2':
        return '/api/alerts/slack-warnings';
      case 'P3':
        return '/api/alerts/ticket'; // Create ticket only
      default:
        return '/api/alerts/default';
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string, resolution?: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      logger.info('Alert resolved', { alertId, resolvedBy, resolution });
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => a.status === 'active');
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter((a) => a.severity === severity);
  }

  /**
   * Get alert count in time window
   */
  getAlertCount(timeWindowHours = 24): number {
    const cutoff = Date.now() - timeWindowHours * 60 * 60 * 1000;
    return this.alerts.filter(
      (a) => new Date(a.timestamp).getTime() > cutoff
    ).length;
  }

  /**
   * Add custom threshold
   */
  addThreshold(threshold: AlertThreshold) {
    this.thresholds.push(threshold);
  }

  /**
   * Remove threshold
   */
  removeThreshold(metric: string, severity: AlertSeverity) {
    this.thresholds = this.thresholds.filter(
      (t) => !(t.metric === metric && t.severity === severity)
    );
  }

  /**
   * Get alert statistics
   */
  getStatistics(timeWindowHours = 24) {
    const cutoff = Date.now() - timeWindowHours * 60 * 60 * 1000;
    const recentAlerts = this.alerts.filter(
      (a) => new Date(a.timestamp).getTime() > cutoff
    );

    return {
      total: recentAlerts.length,
      active: recentAlerts.filter((a) => a.status === 'active').length,
      acknowledged: recentAlerts.filter((a) => a.status === 'acknowledged').length,
      resolved: recentAlerts.filter((a) => a.status === 'resolved').length,
      bySeverity: {
        P0: recentAlerts.filter((a) => a.severity === 'P0').length,
        P1: recentAlerts.filter((a) => a.severity === 'P1').length,
        P2: recentAlerts.filter((a) => a.severity === 'P2').length,
        P3: recentAlerts.filter((a) => a.severity === 'P3').length,
      },
    };
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(daysToKeep = 30) {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(
      (a) => new Date(a.timestamp).getTime() > cutoff
    );
  }
}

// Export singleton instance
export const alertManager = new AlertManager();

export default alertManager;
