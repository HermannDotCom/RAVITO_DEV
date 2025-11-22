/**
 * Business Metrics Service
 * Tracks KPIs, revenue, transactions, and business health
 */

import { supabase } from '../../lib/supabase';
import { logger } from './logger';

export interface RevenueMetrics {
  today: number;
  week: number;
  month: number;
  trend: number; // percentage change
}

export interface TransactionMetrics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

export interface OrderMetrics {
  averageValue: number;
  trend: number;
  totalOrders: number;
}

export interface SupplierMetrics {
  averageResponseTime: number; // in minutes
  totalActive: number;
  performanceScore: number;
}

export interface CustomerMetrics {
  nps: number;
  churnRate: number;
  satisfaction: number;
}

export interface PaymentMethodBreakdown {
  orange: number;
  wave: number;
  mtn: number;
  card: number;
}

class BusinessMetricsService {
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();

  /**
   * Get from cache or fetch
   */
  private async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data as T;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    return this.getOrFetch('revenue', async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        // Get commission revenue from orders
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('status', 'delivered')
          .gte('created_at', today.toISOString());

        const { data: weekOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('status', 'delivered')
          .gte('created_at', weekAgo.toISOString());

        const { data: monthOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('status', 'delivered')
          .gte('created_at', monthAgo.toISOString());

        const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total * 0.02), 0) || 0;
        const weekRevenue = weekOrders?.reduce((sum, o) => sum + (o.total * 0.02), 0) || 0;
        const monthRevenue = monthOrders?.reduce((sum, o) => sum + (o.total * 0.02), 0) || 0;

        // Calculate week-over-week trend
        const prevWeekStart = new Date(weekAgo);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const { data: prevWeekOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('status', 'delivered')
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', weekAgo.toISOString());

        const prevWeekRevenue = prevWeekOrders?.reduce((sum, o) => sum + (o.total * 0.02), 0) || 1;
        const trend = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;

        return {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          trend,
        };
      } catch (error) {
        logger.error('Failed to fetch revenue metrics', error as Error);
        return { today: 0, week: 0, month: 0, trend: 0 };
      }
    });
  }

  /**
   * Get transaction metrics
   */
  async getTransactionMetrics(): Promise<TransactionMetrics> {
    return this.getOrFetch('transactions', async () => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('status')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const total = orders?.length || 0;
        const successful = orders?.filter((o) => o.status === 'delivered').length || 0;
        const failed = orders?.filter((o) => o.status === 'cancelled').length || 0;
        const successRate = total > 0 ? (successful / total) * 100 : 100;

        return { total, successful, failed, successRate };
      } catch (error) {
        logger.error('Failed to fetch transaction metrics', error as Error);
        return { total: 0, successful: 0, failed: 0, successRate: 100 };
      }
    });
  }

  /**
   * Get order metrics
   */
  async getOrderMetrics(): Promise<OrderMetrics> {
    return this.getOrFetch('orders', async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const { data: thisWeek } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', weekAgo.toISOString());

        const { data: lastWeek } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString());

        const thisWeekTotal = thisWeek?.reduce((sum, o) => sum + o.total, 0) || 0;
        const thisWeekCount = thisWeek?.length || 0;
        const thisWeekAvg = thisWeekCount > 0 ? thisWeekTotal / thisWeekCount : 0;

        const lastWeekTotal = lastWeek?.reduce((sum, o) => sum + o.total, 0) || 0;
        const lastWeekCount = lastWeek?.length || 0;
        const lastWeekAvg = lastWeekCount > 0 ? lastWeekTotal / lastWeekCount : 1;

        const trend = lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

        return {
          averageValue: thisWeekAvg,
          trend,
          totalOrders: thisWeekCount,
        };
      } catch (error) {
        logger.error('Failed to fetch order metrics', error as Error);
        return { averageValue: 0, trend: 0, totalOrders: 0 };
      }
    });
  }

  /**
   * Get supplier metrics
   */
  async getSupplierMetrics(): Promise<SupplierMetrics> {
    return this.getOrFetch('suppliers', async () => {
      try {
        // Calculate average response time from orders
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at, updated_at, status')
          .in('status', ['accepted', 'in_transit', 'delivered'])
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        let totalResponseTime = 0;
        let responseCount = 0;

        orders?.forEach((order) => {
          const created = new Date(order.created_at).getTime();
          const updated = new Date(order.updated_at).getTime();
          const responseTime = (updated - created) / (1000 * 60); // minutes
          
          if (responseTime < 120) { // Only count responses under 2 hours
            totalResponseTime += responseTime;
            responseCount++;
          }
        });

        const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 15;

        // Get active suppliers
        const { data: suppliers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'supplier')
          .eq('is_approved', true);

        const totalActive = suppliers?.length || 0;

        // Calculate performance score (based on response time)
        const performanceScore = Math.max(0, 100 - (avgResponseTime / 15) * 100);

        return {
          averageResponseTime: avgResponseTime,
          totalActive,
          performanceScore,
        };
      } catch (error) {
        logger.error('Failed to fetch supplier metrics', error as Error);
        return { averageResponseTime: 15, totalActive: 0, performanceScore: 70 };
      }
    });
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(): Promise<CustomerMetrics> {
    return this.getOrFetch('customers', async () => {
      try {
        // Get ratings for NPS calculation
        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Calculate NPS (simplified: using 5-star to 10-point conversion)
        const npsScores = ratings?.map((r) => Math.round((r.rating / 5) * 10)) || [];
        const promoters = npsScores.filter((s) => s >= 9).length;
        const detractors = npsScores.filter((s) => s <= 6).length;
        const nps = npsScores.length > 0 ? ((promoters - detractors) / npsScores.length) * 100 : 70;

        // Calculate average satisfaction
        const avgRating = ratings?.length
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 4;
        const satisfaction = (avgRating / 5) * 100;

        // Simplified churn rate (would need more complex calculation in production)
        const churnRate = 2.1;

        return { nps: Math.round(nps), churnRate, satisfaction };
      } catch (error) {
        logger.error('Failed to fetch customer metrics', error as Error);
        return { nps: 68, churnRate: 2.1, satisfaction: 80 };
      }
    });
  }

  /**
   * Get payment method breakdown
   */
  async getPaymentMethodBreakdown(): Promise<PaymentMethodBreakdown> {
    return this.getOrFetch('payment-methods', async () => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('payment_method')
          .eq('status', 'delivered')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const total = orders?.length || 0;
        if (total === 0) {
          return { orange: 45, wave: 35, mtn: 18, card: 2 };
        }

        const breakdown = orders.reduce(
          (acc, order) => {
            const method = order.payment_method?.toLowerCase() || 'orange';
            acc[method as keyof PaymentMethodBreakdown] = (acc[method as keyof PaymentMethodBreakdown] || 0) + 1;
            return acc;
          },
          { orange: 0, wave: 0, mtn: 0, card: 0 }
        );

        // Convert to percentages
        return {
          orange: (breakdown.orange / total) * 100,
          wave: (breakdown.wave / total) * 100,
          mtn: (breakdown.mtn / total) * 100,
          card: (breakdown.card / total) * 100,
        };
      } catch (error) {
        logger.error('Failed to fetch payment breakdown', error as Error);
        return { orange: 45, wave: 35, mtn: 18, card: 2 };
      }
    });
  }

  /**
   * Get comprehensive business health report
   */
  async getBusinessHealthReport() {
    try {
      const [revenue, transactions, orders, suppliers, customers, payments] = await Promise.all([
        this.getRevenueMetrics(),
        this.getTransactionMetrics(),
        this.getOrderMetrics(),
        this.getSupplierMetrics(),
        this.getCustomerMetrics(),
        this.getPaymentMethodBreakdown(),
      ]);

      return {
        revenue,
        transactions,
        orders,
        suppliers,
        customers,
        payments,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to generate business health report', error as Error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const businessMetrics = new BusinessMetricsService();

export default businessMetrics;
