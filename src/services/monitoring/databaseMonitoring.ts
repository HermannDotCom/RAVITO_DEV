/**
 * Database Performance Monitoring Service
 * Tracks query performance, connection pooling, and database health
 */

import { supabase } from '../../lib/supabase';
import { logger } from './logger';

export interface QueryMetric {
  query: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ConnectionMetrics {
  active: number;
  idle: number;
  total: number;
  utilizationPercent: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

class DatabasePerformanceMonitoring {
  private queryMetrics: QueryMetric[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private cacheStats: CacheMetrics = { hits: 0, misses: 0, hitRate: 0 };

  /**
   * Track a database query
   */
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      const metric: QueryMetric = {
        query: queryName,
        duration,
        timestamp,
        success: true,
      };

      this.recordQueryMetric(metric);

      // Alert if slow query
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: queryName,
          duration,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      const metric: QueryMetric = {
        query: queryName,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.recordQueryMetric(metric);
      logger.error('Query failed', error as Error, { query: queryName });

      throw error;
    }
  }

  /**
   * Record query metric
   */
  private recordQueryMetric(metric: QueryMetric) {
    this.queryMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }

    // Send to backend for aggregation
    this.sendMetricToBackend(metric);
  }

  /**
   * Send metric to backend
   */
  private async sendMetricToBackend(metric: QueryMetric) {
    try {
      if (import.meta.env.PROD) {
        // In production, send to monitoring table
        // await supabase.from('query_metrics').insert([metric]);
      }
    } catch (error) {
      console.error('Failed to send query metric:', error);
    }
  }

  /**
   * Get slow queries
   */
  getSlowQueries(thresholdMs = 1000): QueryMetric[] {
    return this.queryMetrics.filter((m) => m.duration > thresholdMs);
  }

  /**
   * Get average query duration
   */
  getAverageQueryDuration(): number {
    if (this.queryMetrics.length === 0) return 0;

    const total = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.queryMetrics.length;
  }

  /**
   * Get P95 query duration
   */
  getP95QueryDuration(): number {
    if (this.queryMetrics.length === 0) return 0;

    const sorted = [...this.queryMetrics]
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * Get query success rate
   */
  getQuerySuccessRate(): number {
    if (this.queryMetrics.length === 0) return 100;

    const successful = this.queryMetrics.filter((m) => m.success).length;
    return (successful / this.queryMetrics.length) * 100;
  }

  /**
   * Track cache hit/miss
   */
  trackCacheHit() {
    this.cacheStats.hits++;
    this.updateCacheHitRate();
  }

  trackCacheMiss() {
    this.cacheStats.misses++;
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheStats };
  }

  /**
   * Get connection pool metrics (simulated for Supabase)
   */
  async getConnectionMetrics(): Promise<ConnectionMetrics> {
    // Supabase manages connection pooling internally
    // This is a simulated metric based on usage patterns
    const activeQueries = this.queryMetrics.filter(
      (m) => Date.now() - new Date(m.timestamp).getTime() < 5000
    ).length;

    return {
      active: activeQueries,
      idle: 88 - activeQueries,
      total: 100,
      utilizationPercent: (activeQueries / 100) * 100,
    };
  }

  /**
   * Get database health status
   */
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: {
      avgQueryDuration: number;
      p95QueryDuration: number;
      successRate: number;
      cacheHitRate: number;
    };
  }> {
    const avgDuration = this.getAverageQueryDuration();
    const p95Duration = this.getP95QueryDuration();
    const successRate = this.getQuerySuccessRate();
    const cacheHitRate = this.cacheStats.hitRate;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (p95Duration > 2000 || successRate < 95) {
      status = 'critical';
    } else if (p95Duration > 1000 || successRate < 98) {
      status = 'degraded';
    }

    return {
      status,
      metrics: {
        avgQueryDuration: avgDuration,
        p95QueryDuration: p95Duration,
        successRate,
        cacheHitRate,
      },
    };
  }

  /**
   * Generate optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    const slowQueries = this.getSlowQueries();
    if (slowQueries.length > 0) {
      recommendations.push(
        `${slowQueries.length} slow queries detected. Consider adding indexes or optimizing queries.`
      );
    }

    if (this.cacheStats.hitRate < 80) {
      recommendations.push(
        `Cache hit rate is ${this.cacheStats.hitRate.toFixed(1)}%. Consider implementing better caching strategies.`
      );
    }

    const successRate = this.getQuerySuccessRate();
    if (successRate < 98) {
      recommendations.push(
        `Query success rate is ${successRate.toFixed(1)}%. Investigate failing queries.`
      );
    }

    return recommendations;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.queryMetrics = [];
    this.cacheStats = { hits: 0, misses: 0, hitRate: 0 };
  }
}

// Export singleton instance
export const dbPerformanceMonitoring = new DatabasePerformanceMonitoring();

export default dbPerformanceMonitoring;
