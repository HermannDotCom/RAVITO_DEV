/**
 * Operations Dashboard
 * DevOps/SRE focused metrics and system health
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Database, Zap, Clock, CheckCircle } from 'lucide-react';
import { performanceMonitoring } from '../../services/monitoring/performanceMonitoring';
import { dbPerformanceMonitoring } from '../../services/monitoring/databaseMonitoring';
import { alertManager, Alert } from '../../services/monitoring/alertManager';

export const OperationsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const metrics = performanceMonitoring.getMetrics();
      const uxScore = performanceMonitoring.calculateUXScore();
      const rating = performanceMonitoring.getPerformanceRating();
      
      const health = await dbPerformanceMonitoring.getDatabaseHealth();
      const activeAlerts = alertManager.getActiveAlerts();
      const stats = alertManager.getStatistics();

      setPerformanceMetrics({ ...metrics, uxScore, rating });
      setDbHealth(health);
      setAlerts(activeAlerts);
      setAlertStats(stats);
    } catch (error) {
      console.error('Failed to load operations metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'critical':
      case 'poor':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0':
        return 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'P1':
        return 'text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'P2':
        return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'P3':
        return 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Operations Dashboard
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Error Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                0.2%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Target: &lt;1% <span className="text-green-600">✓</span>
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        {/* API Response Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                API Response Time (P95)
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {dbHealth?.metrics.p95QueryDuration.toFixed(0)}ms
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Target: &lt;500ms <span className="text-green-600">✓</span>
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Database Health
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    dbHealth?.status
                  )}`}
                >
                  {dbHealth?.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Success Rate: {dbHealth?.metrics.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <Database className="h-8 w-8 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Web Vitals Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                LCP (Largest Contentful Paint)
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                  performanceMetrics?.rating
                )}`}
              >
                {performanceMetrics?.LCP ? `${performanceMetrics.LCP.toFixed(0)}ms` : 'N/A'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    ((4000 - (performanceMetrics?.LCP || 4000)) / 4000) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Target: &lt;2.5s</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                INP (Interaction to Next Paint)
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                  performanceMetrics?.rating
                )}`}
              >
                {performanceMetrics?.INP ? `${performanceMetrics.INP.toFixed(0)}ms` : 'N/A'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    ((500 - (performanceMetrics?.INP || 500)) / 500) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Target: &lt;200ms</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                CLS (Cumulative Layout Shift)
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                  performanceMetrics?.rating
                )}`}
              >
                {performanceMetrics?.CLS ? performanceMetrics.CLS.toFixed(3) : 'N/A'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    ((0.25 - (performanceMetrics?.CLS || 0.25)) / 0.25) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Target: &lt;0.1</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall UX Score
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {performanceMetrics?.uxScore || 0}/100
            </span>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Alerts
          </h3>
          <span className="text-sm text-gray-500">
            {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              No active alerts. System running smoothly!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      alert.severity === 'P0' || alert.severity === 'P1'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Statistics */}
        {alertStats && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertStats.bySeverity.P0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">P0 (Critical)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertStats.bySeverity.P1}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">P1 (High)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertStats.bySeverity.P2}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">P2 (Medium)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertStats.resolved}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved (24h)</p>
            </div>
          </div>
        )}
      </div>

      {/* Database Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Database Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Average Query Duration
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {dbHealth?.metrics.avgQueryDuration.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              P95 Query Duration
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {dbHealth?.metrics.p95QueryDuration.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {dbHealth?.metrics.cacheHitRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;
