/**
 * Integration Tests: Alert Manager
 * Tests alert creation, management, and thresholds
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { alertManager } from '../../services/monitoring/alertManager';

describe('Alert Manager', () => {
  beforeEach(() => {
    // Clear old alerts before each test
    alertManager.clearOldAlerts(0);
  });

  describe('Alert Creation', () => {
    it('should create an alert with all required fields', () => {
      const alert = alertManager.createAlert({
        severity: 'P1',
        title: 'Test Alert',
        message: 'This is a test alert',
        context: { test: true },
      });

      expect(alert).toBeDefined();
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('severity', 'P1');
      expect(alert).toHaveProperty('title', 'Test Alert');
      expect(alert).toHaveProperty('message', 'This is a test alert');
      expect(alert).toHaveProperty('status', 'active');
      expect(alert).toHaveProperty('timestamp');
      expect(alert.context).toEqual({ test: true });
    });

    it('should generate unique alert IDs', () => {
      const alert1 = alertManager.createAlert({
        severity: 'P2',
        title: 'Alert 1',
        message: 'Message 1',
      });

      const alert2 = alertManager.createAlert({
        severity: 'P2',
        title: 'Alert 2',
        message: 'Message 2',
      });

      expect(alert1.id).not.toBe(alert2.id);
    });

    it('should set timestamp on creation', () => {
      const before = Date.now();
      const alert = alertManager.createAlert({
        severity: 'P3',
        title: 'Timestamped Alert',
        message: 'Check timestamp',
      });
      const after = Date.now();

      const alertTime = new Date(alert.timestamp).getTime();
      expect(alertTime).toBeGreaterThanOrEqual(before);
      expect(alertTime).toBeLessThanOrEqual(after);
    });
  });

  describe('Threshold Checking', () => {
    it('should trigger P0 alert for high error rate', () => {
      alertManager.checkMetric('error_rate', 2.5);
      
      const activeAlerts = alertManager.getActiveAlerts();
      const p0Alerts = activeAlerts.filter(a => a.severity === 'P0');
      
      expect(p0Alerts.length).toBeGreaterThan(0);
    });

    it('should not trigger alert below threshold', () => {
      alertManager.checkMetric('error_rate', 0.5);
      
      const activeAlerts = alertManager.getActiveAlerts();
      const errorRateAlerts = activeAlerts.filter(a => 
        a.context?.metric === 'error_rate'
      );
      
      expect(errorRateAlerts.length).toBe(0);
    });

    it('should trigger P1 alert for medium error rate', () => {
      alertManager.checkMetric('error_rate', 1.5);
      
      const activeAlerts = alertManager.getActiveAlerts();
      const p1Alerts = activeAlerts.filter(a => a.severity === 'P1');
      
      expect(p1Alerts.length).toBeGreaterThan(0);
    });

    it('should trigger alert for high P95 latency', () => {
      alertManager.checkMetric('p95_latency', 600);
      
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });

    it('should trigger alert for low cache hit rate', () => {
      alertManager.checkMetric('cache_hit_rate', 60);
      
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Alert Management', () => {
    it('should acknowledge an alert', () => {
      const alert = alertManager.createAlert({
        severity: 'P2',
        title: 'Test Alert',
        message: 'To be acknowledged',
      });

      alertManager.acknowledgeAlert(alert.id, 'test-user');
      
      const activeAlerts = alertManager.getActiveAlerts();
      const acknowledgedAlert = activeAlerts.find(a => a.id === alert.id);
      
      expect(acknowledgedAlert).toBeUndefined(); // Should not be in active alerts
    });

    it('should resolve an alert', () => {
      const alert = alertManager.createAlert({
        severity: 'P2',
        title: 'Test Alert',
        message: 'To be resolved',
      });

      alertManager.resolveAlert(alert.id, 'test-user', 'Fixed the issue');
      
      const activeAlerts = alertManager.getActiveAlerts();
      const resolvedAlert = activeAlerts.find(a => a.id === alert.id);
      
      expect(resolvedAlert).toBeUndefined();
    });

    it('should get active alerts', () => {
      alertManager.createAlert({
        severity: 'P1',
        title: 'Active Alert 1',
        message: 'Message 1',
      });

      alertManager.createAlert({
        severity: 'P2',
        title: 'Active Alert 2',
        message: 'Message 2',
      });

      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThanOrEqual(2);
      expect(activeAlerts.every(a => a.status === 'active')).toBe(true);
    });

    it('should filter alerts by severity', () => {
      alertManager.createAlert({
        severity: 'P0',
        title: 'Critical Alert',
        message: 'Critical message',
      });

      alertManager.createAlert({
        severity: 'P1',
        title: 'High Alert',
        message: 'High message',
      });

      const p0Alerts = alertManager.getAlertsBySeverity('P0');
      expect(p0Alerts.length).toBeGreaterThan(0);
      expect(p0Alerts.every(a => a.severity === 'P0')).toBe(true);
    });
  });

  describe('Alert Statistics', () => {
    it('should provide alert count in time window', () => {
      alertManager.createAlert({
        severity: 'P2',
        title: 'Test Alert',
        message: 'Message',
      });

      const count = alertManager.getAlertCount(24);
      expect(count).toBeGreaterThan(0);
    });

    it('should provide comprehensive statistics', () => {
      alertManager.createAlert({
        severity: 'P0',
        title: 'Critical',
        message: 'Critical',
      });

      alertManager.createAlert({
        severity: 'P1',
        title: 'High',
        message: 'High',
      });

      const stats = alertManager.getStatistics(24);
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('acknowledged');
      expect(stats).toHaveProperty('resolved');
      expect(stats).toHaveProperty('bySeverity');
      
      expect(stats.bySeverity).toHaveProperty('P0');
      expect(stats.bySeverity).toHaveProperty('P1');
      expect(stats.bySeverity).toHaveProperty('P2');
      expect(stats.bySeverity).toHaveProperty('P3');
    });

    it('should count resolved alerts correctly', () => {
      const alert = alertManager.createAlert({
        severity: 'P2',
        title: 'Test',
        message: 'Test',
      });

      alertManager.resolveAlert(alert.id, 'test-user');
      
      const stats = alertManager.getStatistics(24);
      expect(stats.resolved).toBeGreaterThan(0);
    });
  });

  describe('Custom Thresholds', () => {
    it('should add custom threshold', () => {
      alertManager.addThreshold({
        metric: 'custom_metric',
        condition: 'gt',
        value: 100,
        severity: 'P2',
        message: 'Custom threshold exceeded',
      });

      alertManager.checkMetric('custom_metric', 150);
      
      const activeAlerts = alertManager.getActiveAlerts();
      const customAlert = activeAlerts.find(a => 
        a.context?.metric === 'custom_metric'
      );
      
      expect(customAlert).toBeDefined();
    });

    it('should remove threshold', () => {
      alertManager.addThreshold({
        metric: 'temp_metric',
        condition: 'gt',
        value: 50,
        severity: 'P3',
        message: 'Temporary threshold',
      });

      alertManager.removeThreshold('temp_metric', 'P3');
      alertManager.checkMetric('temp_metric', 100);
      
      const activeAlerts = alertManager.getActiveAlerts();
      const tempAlert = activeAlerts.find(a => 
        a.context?.metric === 'temp_metric'
      );
      
      expect(tempAlert).toBeUndefined();
    });
  });

  describe('Alert Cleanup', () => {
    it('should clear old alerts', () => {
      alertManager.createAlert({
        severity: 'P3',
        title: 'Old Alert',
        message: 'Should be cleared',
      });

      // Clear alerts older than 0 days (all alerts)
      alertManager.clearOldAlerts(0);
      
      const stats = alertManager.getStatistics(24);
      expect(stats.total).toBe(0);
    });

    it('should keep recent alerts', () => {
      alertManager.createAlert({
        severity: 'P2',
        title: 'Recent Alert',
        message: 'Should be kept',
      });

      // Clear alerts older than 30 days
      alertManager.clearOldAlerts(30);
      
      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Severity Levels', () => {
    it('should handle P0 critical alerts', () => {
      const alert = alertManager.createAlert({
        severity: 'P0',
        title: 'Critical',
        message: 'System down',
      });

      expect(alert.severity).toBe('P0');
    });

    it('should handle P1 high alerts', () => {
      const alert = alertManager.createAlert({
        severity: 'P1',
        title: 'High',
        message: 'Performance degraded',
      });

      expect(alert.severity).toBe('P1');
    });

    it('should handle P2 medium alerts', () => {
      const alert = alertManager.createAlert({
        severity: 'P2',
        title: 'Medium',
        message: 'Cache issue',
      });

      expect(alert.severity).toBe('P2');
    });

    it('should handle P3 low alerts', () => {
      const alert = alertManager.createAlert({
        severity: 'P3',
        title: 'Low',
        message: 'Minor issue',
      });

      expect(alert.severity).toBe('P3');
    });
  });
});
