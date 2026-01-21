/**
 * Supplier Analytics Service
 * 
 * Handles analytics data aggregation and calculations for the Supplier Intelligence Dashboard
 */

import { supabase } from '../lib/supabase';
import type { 
  SupplierAnalytics, 
  SupplierDashboardData,
  AnalyticsFilterParams 
} from '../types/intelligence';

export class SupplierAnalyticsService {
  /**
   * Get supplier analytics for a specific date range
   */
  static async getSupplierAnalytics(
    supplierId: string,
    params: AnalyticsFilterParams = {}
  ): Promise<SupplierAnalytics[]> {
    try {
      let query = supabase
        .from('supplier_analytics')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('date', { ascending: false });

      if (params.startDate) {
        query = query.gte('date', params.startDate.toISOString().split('T')[0]);
      }

      if (params.endDate) {
        query = query.lte('date', params.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapAnalyticsFromDb);
    } catch (error) {
      console.error('Error fetching supplier analytics:', error);
      throw error;
    }
  }

  /**
   * Get current day analytics for a supplier
   */
  static async getCurrentAnalytics(supplierId: string): Promise<SupplierAnalytics | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('supplier_analytics')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapAnalyticsFromDb(data);
    } catch (error) {
      console.error('Error fetching current analytics:', error);
      return null;
    }
  }

  /**
   * Calculate and aggregate analytics from orders
   * This is typically called by a scheduled job or edge function
   */
  static async calculateDailyAnalytics(supplierId: string, date: Date): Promise<void> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      // Get orders for the day
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('supplier_id', supplierId)
        .gte('created_at', dateStr)
        .lt('created_at', nextDayStr);

      if (ordersError) throw ordersError;

      // Calculate metrics
      const totalOrders = orders?.length || 0;
      const acceptedOrders = orders?.filter(o => 
        ['paid', 'preparing', 'delivering', 'delivered'].includes(o.status)
      ).length || 0;
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      
      const acceptanceRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 0;
      
      const grossRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const netRevenue = orders?.reduce((sum, o) => 
        sum + ((o.total_amount || 0) - (o.supplier_commission || 0)), 0
      ) || 0;
      const averageOrderValue = completedOrders > 0 ? grossRevenue / completedOrders : 0;

      // Calculate delivery times
      const deliveredOrders = orders?.filter(o => 
        o.status === 'delivered' && o.delivered_at && o.accepted_at
      ) || [];
      const deliveryTimes = deliveredOrders.map(o => {
        const accepted = new Date(o.accepted_at).getTime();
        const delivered = new Date(o.delivered_at).getTime();
        return (delivered - accepted) / 60000; // Convert to minutes
      });
      const averageDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : undefined;

      // Get ratings for the day
      const { data: ratings } = await supabase
        .from('ratings')
        .select('overall')
        .eq('to_user_id', supplierId)
        .gte('created_at', dateStr)
        .lt('created_at', nextDayStr);

      const customerSatisfaction = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length
        : undefined;

      // Get unique customers
      const uniqueCustomers = new Set(orders?.map(o => o.client_id)).size;

      // Get zones served
      const zonesServed = [...new Set(orders?.map(o => o.zone_id).filter(Boolean))];

      // Upsert analytics
      const { error: upsertError } = await supabase
        .from('supplier_analytics')
        .upsert({
          supplier_id: supplierId,
          date: dateStr,
          total_orders: totalOrders,
          accepted_orders: acceptedOrders,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
          acceptance_rate: acceptanceRate,
          gross_revenue: grossRevenue,
          net_revenue: netRevenue,
          average_order_value: Math.round(averageOrderValue),
          average_delivery_time: averageDeliveryTime ? Math.round(averageDeliveryTime) : null,
          customer_satisfaction: customerSatisfaction,
          unique_customers: uniqueCustomers,
          zones_served: zonesServed,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'supplier_id,date'
        });

      if (upsertError) throw upsertError;
    } catch (error) {
      console.error('Error calculating daily analytics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated KPIs for dashboard
   */
  static async getDashboardKPIs(supplierId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const analytics = await this.getSupplierAnalytics(supplierId, {
        startDate,
        endDate: new Date()
      });

      if (!analytics || analytics.length === 0) {
        return this.getEmptyKPIs();
      }

      // Calculate aggregated metrics
      const totalOrders = analytics.reduce((sum, a) => sum + a.totalOrders, 0);
      const totalAccepted = analytics.reduce((sum, a) => sum + a.acceptedOrders, 0);
      const acceptanceRate = totalOrders > 0 ? (totalAccepted / totalOrders) * 100 : 0;

      const deliveryTimes = analytics
        .map(a => a.averageDeliveryTime)
        .filter((t): t is number => t !== undefined);
      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

      const ratings = analytics
        .map(a => a.customerSatisfaction)
        .filter((r): r is number => r !== undefined);
      const customerRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      const monthlyRevenue = analytics.reduce((sum, a) => sum + a.grossRevenue, 0);

      // Calculate revenue growth (compare first half vs second half)
      const midpoint = Math.floor(analytics.length / 2);
      const firstHalf = analytics.slice(midpoint);
      const secondHalf = analytics.slice(0, midpoint);
      
      const firstHalfRevenue = firstHalf.reduce((sum, a) => sum + a.grossRevenue, 0);
      const secondHalfRevenue = secondHalf.reduce((sum, a) => sum + a.grossRevenue, 0);
      const revenueGrowth = firstHalfRevenue > 0 
        ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100
        : 0;

      // Calculate customer retention
      const totalCustomers = analytics.reduce((sum, a) => sum + a.uniqueCustomers, 0);
      const repeatCustomers = analytics.reduce((sum, a) => sum + a.repeatCustomers, 0);
      const customerRetention = totalCustomers > 0 
        ? (repeatCustomers / totalCustomers) * 100 
        : 0;

      return {
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        customerRating: Math.round(customerRating * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue),
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        customerRetention: Math.round(customerRetention * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating dashboard KPIs:', error);
      return this.getEmptyKPIs();
    }
  }

  /**
   * Get revenue opportunity analysis
   */
  static async getRevenueOpportunity(supplierId: string, zoneId?: string) {
    try {
      // Get supplier's current performance
      const kpis = await this.getDashboardKPIs(supplierId);

      // Get zone benchmarks
      const { data: benchmark } = await supabase
        .from('competitor_benchmarks')
        .select('*')
        .eq('zone_id', zoneId || '')
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      if (!benchmark) {
        return null;
      }

      const top10Revenue = benchmark.top_10_percent_metrics?.revenue || kpis.monthlyRevenue * 2;
      const currentRevenue = kpis.monthlyRevenue;
      const gap = top10Revenue - currentRevenue;

      const actionItems: string[] = [];
      
      if (kpis.acceptanceRate < 90) {
        actionItems.push(`Improve acceptance rate to 90%+ (current: ${kpis.acceptanceRate}%)`);
      }
      if (benchmark.avg_delivery_time && kpis.avgDeliveryTime > benchmark.avg_delivery_time) {
        actionItems.push(`Reduce delivery time to ${benchmark.avg_delivery_time} min (current: ${kpis.avgDeliveryTime} min)`);
      }
      if (kpis.customerRating < 4.5) {
        actionItems.push(`Increase customer rating to 4.5+ (current: ${kpis.customerRating})`);
      }

      return {
        currentMonthlyRevenue: currentRevenue,
        potentialMonthlyRevenue: top10Revenue,
        gapToTop10Percent: gap,
        actionItems
      };
    } catch (error) {
      console.error('Error calculating revenue opportunity:', error);
      return null;
    }
  }

  /**
   * Helper: Map database row to TypeScript type
   */
  private static mapAnalyticsFromDb(data: any): SupplierAnalytics {
    return {
      id: data.id,
      supplierId: data.supplier_id,
      date: new Date(data.date),
      totalOrders: data.total_orders,
      acceptedOrders: data.accepted_orders,
      completedOrders: data.completed_orders,
      cancelledOrders: data.cancelled_orders,
      acceptanceRate: data.acceptance_rate,
      grossRevenue: data.gross_revenue,
      netRevenue: data.net_revenue,
      averageOrderValue: data.average_order_value,
      averageDeliveryTime: data.average_delivery_time,
      onTimeDeliveryRate: data.on_time_delivery_rate,
      customerSatisfaction: data.customer_satisfaction,
      uniqueCustomers: data.unique_customers,
      repeatCustomers: data.repeat_customers,
      newCustomers: data.new_customers,
      churnCustomers: data.churn_customers,
      zonesServed: data.zones_served || [],
      primaryZone: data.primary_zone,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Helper: Get empty KPIs
   */
  private static getEmptyKPIs() {
    return {
      acceptanceRate: 0,
      avgDeliveryTime: 0,
      customerRating: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      customerRetention: 0
    };
  }
}
