/**
 * Performance Monitoring Service
 * Tracks Web Vitals and performance metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface WebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  INP?: number; // Interaction to Next Paint (replaces FID)
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

export interface PerformanceReport {
  metrics: WebVitalsMetrics;
  userAgent: string;
  connection: string;
  timestamp: string;
  page: string;
  deviceType: 'mobile' | 'desktop';
  location?: string;
}

class PerformanceMonitoring {
  private metrics: WebVitalsMetrics = {};
  private reportCallback?: (report: PerformanceReport) => void;

  /**
   * Initialize performance monitoring
   */
  initialize(callback?: (report: PerformanceReport) => void) {
    this.reportCallback = callback;
    this.startWebVitalsTracking();
  }

  /**
   * Start tracking Web Vitals
   */
  private startWebVitalsTracking() {
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  /**
   * Handle individual metric
   */
  private handleMetric(metric: Metric) {
    this.metrics[metric.name as keyof WebVitalsMetrics] = metric.value;
    
    // Send metric to analytics
    this.sendMetric(metric);
    
    // Generate report if all core vitals are collected
    if (this.hasCoreVitals()) {
      this.generateReport();
    }
  }

  /**
   * Check if all core vitals are collected
   */
  private hasCoreVitals(): boolean {
    return !!(this.metrics.LCP && this.metrics.INP && this.metrics.CLS);
  }

  /**
   * Send individual metric to backend
   */
  private async sendMetric(metric: Metric) {
    try {
      // In production, send to analytics service
      if (import.meta.env.PROD) {
        // await fetch('/api/metrics', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     name: metric.name,
        //     value: metric.value,
        //     rating: metric.rating,
        //     delta: metric.delta,
        //   }),
        // });
      }
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  private generateReport() {
    const report: PerformanceReport = {
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      connection: this.getConnectionType(),
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      deviceType: this.getDeviceType(),
      location: this.getGeolocation(),
    };

    // Call registered callback
    if (this.reportCallback) {
      this.reportCallback(report);
    }

    // Send report to backend
    this.sendReport(report);
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as never)['connection' as never];
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'desktop' {
    return /Mobile|Android|iPhone/i.test(navigator.userAgent)
      ? 'mobile'
      : 'desktop';
  }

  /**
   * Get geolocation (if available)
   */
  private getGeolocation(): string | undefined {
    // In production, derive from IP or user settings
    return undefined;
  }

  /**
   * Send report to backend
   */
  private async sendReport(report: PerformanceReport) {
    try {
      if (import.meta.env.PROD) {
        // await fetch('/api/performance-reports', {
        //   method: 'POST',
        //   body: JSON.stringify(report),
        // });
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Calculate user experience score (0-100)
   */
  calculateUXScore(): number {
    const { LCP, INP, CLS } = this.metrics;
    
    if (!LCP || !INP || !CLS) {
      return 0;
    }

    // Scoring based on Web Vitals thresholds
    const lcpScore = LCP <= 2500 ? 100 : LCP <= 4000 ? 50 : 0;
    const inpScore = INP <= 200 ? 100 : INP <= 500 ? 50 : 0;
    const clsScore = CLS <= 0.1 ? 100 : CLS <= 0.25 ? 50 : 0;

    return Math.round((lcpScore + inpScore + clsScore) / 3);
  }

  /**
   * Get performance rating
   */
  getPerformanceRating(): 'good' | 'needs-improvement' | 'poor' {
    const score = this.calculateUXScore();
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Mark custom timing
   */
  markTiming(name: string) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure duration between marks
   */
  measureDuration(name: string, startMark: string, endMark: string): number {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure.duration;
    }
    return 0;
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoring();

export default performanceMonitoring;
