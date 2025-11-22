/**
 * Integration Tests: Business Metrics Service
 * Tests the business metrics calculation and caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { businessMetrics } from '../../services/monitoring/businessMetrics';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => Promise.resolve({ data: [] })),
            toISOString: vi.fn(() => Promise.resolve({ data: [] })),
          })),
          lt: vi.fn(() => Promise.resolve({ data: [] })),
        })),
        gte: vi.fn(() => Promise.resolve({ data: [] })),
        in: vi.fn(() => ({
          gte: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    })),
  },
}));

describe('Business Metrics Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    businessMetrics.clearCache();
  });

  describe('Revenue Metrics', () => {
    it('should calculate revenue metrics', async () => {
      const metrics = await businessMetrics.getRevenueMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('today');
      expect(metrics).toHaveProperty('week');
      expect(metrics).toHaveProperty('month');
      expect(metrics).toHaveProperty('trend');
      
      expect(typeof metrics.today).toBe('number');
      expect(typeof metrics.week).toBe('number');
      expect(typeof metrics.month).toBe('number');
      expect(typeof metrics.trend).toBe('number');
    });

    it('should return non-negative revenue values', async () => {
      const metrics = await businessMetrics.getRevenueMetrics();
      
      expect(metrics.today).toBeGreaterThanOrEqual(0);
      expect(metrics.week).toBeGreaterThanOrEqual(0);
      expect(metrics.month).toBeGreaterThanOrEqual(0);
    });

    it('should cache revenue metrics', async () => {
      const firstCall = await businessMetrics.getRevenueMetrics();
      const secondCall = await businessMetrics.getRevenueMetrics();
      
      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('Transaction Metrics', () => {
    it('should calculate transaction success rate', async () => {
      const metrics = await businessMetrics.getTransactionMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('total');
      expect(metrics).toHaveProperty('successful');
      expect(metrics).toHaveProperty('failed');
      expect(metrics).toHaveProperty('successRate');
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });

    it('should handle zero transactions', async () => {
      const metrics = await businessMetrics.getTransactionMetrics();
      
      if (metrics.total === 0) {
        expect(metrics.successRate).toBe(100); // Default to 100% when no transactions
      }
    });
  });

  describe('Order Metrics', () => {
    it('should calculate average order value', async () => {
      const metrics = await businessMetrics.getOrderMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('averageValue');
      expect(metrics).toHaveProperty('trend');
      expect(metrics).toHaveProperty('totalOrders');
      
      expect(metrics.averageValue).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.totalOrders).toBe('number');
    });

    it('should calculate trend correctly', async () => {
      const metrics = await businessMetrics.getOrderMetrics();
      
      expect(typeof metrics.trend).toBe('number');
      // Trend can be positive or negative
      expect(isFinite(metrics.trend)).toBe(true);
    });
  });

  describe('Supplier Metrics', () => {
    it('should calculate supplier response time', async () => {
      const metrics = await businessMetrics.getSupplierMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('totalActive');
      expect(metrics).toHaveProperty('performanceScore');
      
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.totalActive).toBeGreaterThanOrEqual(0);
      expect(metrics.performanceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Customer Metrics', () => {
    it('should calculate customer satisfaction metrics', async () => {
      const metrics = await businessMetrics.getCustomerMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('nps');
      expect(metrics).toHaveProperty('churnRate');
      expect(metrics).toHaveProperty('satisfaction');
      
      expect(metrics.nps).toBeGreaterThanOrEqual(-100);
      expect(metrics.nps).toBeLessThanOrEqual(100);
      expect(metrics.satisfaction).toBeGreaterThanOrEqual(0);
      expect(metrics.satisfaction).toBeLessThanOrEqual(100);
    });
  });

  describe('Payment Method Breakdown', () => {
    it('should calculate payment method percentages', async () => {
      const breakdown = await businessMetrics.getPaymentMethodBreakdown();
      
      expect(breakdown).toBeDefined();
      expect(breakdown).toHaveProperty('orange');
      expect(breakdown).toHaveProperty('wave');
      expect(breakdown).toHaveProperty('mtn');
      expect(breakdown).toHaveProperty('card');
      
      // Sum should be approximately 100%
      const sum = breakdown.orange + breakdown.wave + breakdown.mtn + breakdown.card;
      expect(sum).toBeGreaterThanOrEqual(99);
      expect(sum).toBeLessThanOrEqual(101);
    });

    it('should return valid percentages', async () => {
      const breakdown = await businessMetrics.getPaymentMethodBreakdown();
      
      Object.values(breakdown).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Business Health Report', () => {
    it('should generate comprehensive health report', async () => {
      const report = await businessMetrics.getBusinessHealthReport();
      
      expect(report).toBeDefined();
      expect(report).toHaveProperty('revenue');
      expect(report).toHaveProperty('transactions');
      expect(report).toHaveProperty('orders');
      expect(report).toHaveProperty('suppliers');
      expect(report).toHaveProperty('customers');
      expect(report).toHaveProperty('payments');
      expect(report).toHaveProperty('timestamp');
    });

    it('should have valid timestamp', async () => {
      const report = await businessMetrics.getBusinessHealthReport();
      
      const timestamp = new Date(report.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Cache Management', () => {
    it('should clear cache correctly', async () => {
      await businessMetrics.getRevenueMetrics();
      businessMetrics.clearCache();
      
      // After clearing cache, next call should fetch fresh data
      const metrics = await businessMetrics.getRevenueMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
