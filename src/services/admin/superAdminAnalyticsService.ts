import { supabase } from '../../lib/supabase';

export interface SuperAdminMetrics {
  // Performance financière
  grossMerchandiseValue: number;      // GMV - Valeur totale des transactions
  netRevenue: number;                  // Revenus nets (commissions)
  averageOrderValue: number;           // Panier moyen
  revenuePerUser: number;              // ARPU - Average Revenue Per User
  
  // Santé de la plateforme
  activeClientsLast30Days: number;     // Clients actifs (30j)
  activeSuppliersLast30Days: number;   // Fournisseurs actifs (30j)
  newUsersThisMonth: number;           // Nouveaux inscrits ce mois
  userRetentionRate: number;           // Taux de rétention
  
  // Performance opérationnelle
  orderFulfillmentRate: number;        // Taux de commandes abouties
  averageDeliveryTime: number;         // Temps moyen de livraison (heures)
  cancellationRate: number;            // Taux d'annulation
  disputeRate: number;                 // Taux de litiges
  
  // Indicateurs de croissance
  monthOverMonthGrowth: number;        // Croissance MoM
  yearOverYearGrowth: number;          // Croissance YoY
  projectedMonthlyRevenue: number;     // Projection fin de mois
}

export interface TopSupplier {
  id: string;
  name: string;
  totalRevenue: number;
  orderCount: number;
  averageRating: number;
  commissionGenerated: number;
}

export interface TopClient {
  id: string;
  name: string;
  businessName: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
}

export interface OrderStats {
  delivered: number;
  inProgress: number;
  cancelled: number;
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric?: number;
}

export interface GrowthMetrics {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  monthOverMonthGrowth: number;
  currentYearRevenue: number;
  previousYearRevenue: number;
  yearOverYearGrowth: number;
}

/**
 * Get comprehensive Super Admin metrics for a date range
 */
export async function getSuperAdminMetrics(startDate: Date, endDate: Date): Promise<SuperAdminMetrics> {
  try {
    // Get all paid orders in the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, client_commission, supplier_commission, created_at, delivered_at, status, payment_status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('payment_status', 'paid');

    if (ordersError) throw ordersError;

    // Get user profiles for active users calculation
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, created_at');

    if (profilesError) throw profilesError;

    // Calculate 30 days ago for active users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get orders from last 30 days for active users
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('client_id, supplier_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('payment_status', 'paid');

    if (recentOrdersError) throw recentOrdersError;

    // Get current month start for new users calculation
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate metrics
    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
    const cancelledOrders = orders?.filter(o => o.status === 'cancelled') || [];
    
    const grossMerchandiseValue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const netRevenue = orders?.reduce((sum, o) => sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? grossMerchandiseValue / totalOrders : 0;

    // Active users (made at least one order in last 30 days)
    const activeClientIds = new Set(recentOrders?.map(o => o.client_id) || []);
    const activeSupplierIds = new Set(recentOrders?.map(o => o.supplier_id) || []);
    const activeClientsLast30Days = activeClientIds.size;
    const activeSuppliersLast30Days = activeSupplierIds.size;

    // New users this month
    const newUsersThisMonth = profiles?.filter(p => 
      new Date(p.created_at) >= monthStart
    ).length || 0;

    // Revenue per user (ARPU)
    const totalActiveUsers = activeClientsLast30Days + activeSuppliersLast30Days;
    const revenuePerUser = totalActiveUsers > 0 ? netRevenue / totalActiveUsers : 0;

    // User retention rate - Requires historical data analysis
    // TODO: Implement proper retention calculation comparing returning vs new users
    const userRetentionRate = 0;

    // Order fulfillment rate
    const orderFulfillmentRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Average delivery time (in hours)
    const deliveredOrdersWithTime = completedOrders.filter(o => o.delivered_at && o.created_at);
    const totalDeliveryTime = deliveredOrdersWithTime.reduce((sum, o) => {
      const created = new Date(o.created_at);
      const delivered = new Date(o.delivered_at!);
      const hours = (delivered.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    const averageDeliveryTime = deliveredOrdersWithTime.length > 0 ? totalDeliveryTime / deliveredOrdersWithTime.length : 0;

    // Cancellation rate
    const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

    // Dispute rate (approximation using cancelled orders)
    const disputeRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

    // Get growth metrics
    const growthMetrics = await getGrowthMetrics();

    return {
      grossMerchandiseValue,
      netRevenue,
      averageOrderValue,
      revenuePerUser,
      activeClientsLast30Days,
      activeSuppliersLast30Days,
      newUsersThisMonth,
      userRetentionRate,
      orderFulfillmentRate,
      averageDeliveryTime,
      cancellationRate,
      disputeRate,
      monthOverMonthGrowth: growthMetrics.monthOverMonthGrowth,
      yearOverYearGrowth: growthMetrics.yearOverYearGrowth,
      projectedMonthlyRevenue: growthMetrics.currentMonthRevenue
    };
  } catch (error) {
    console.error('Error getting super admin metrics:', error);
    throw error;
  }
}

/**
 * Get top suppliers by revenue
 */
export async function getTopSuppliers(limit: number = 5, year?: number): Promise<TopSupplier[]> {
  try {
    const startDate = year ? new Date(year, 0, 1).toISOString() : undefined;
    const endDate = year ? new Date(year, 11, 31, 23, 59, 59).toISOString() : undefined;

    // 1. Récupérer les commandes payées avec supplier_id
    let ordersQuery = supabase
      .from('orders')
      .select('supplier_id, total_amount, supplier_commission')
      .eq('payment_status', 'paid')
      .not('supplier_id', 'is', null);

    if (startDate && endDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders for top suppliers:', ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // 2. Agréger par fournisseur
    const supplierMap = new Map<string, { 
      totalRevenue: number; 
      orderCount: number; 
      commissionGenerated: number 
    }>();

    orders.forEach(order => {
      if (order.supplier_id) {
        const existing = supplierMap.get(order.supplier_id) || { 
          totalRevenue: 0, 
          orderCount: 0, 
          commissionGenerated: 0 
        };
        supplierMap.set(order.supplier_id, {
          totalRevenue: existing.totalRevenue + (order.total_amount || 0),
          orderCount: existing.orderCount + 1,
          commissionGenerated: existing.commissionGenerated + (order.supplier_commission || 0),
        });
      }
    });

    if (supplierMap.size === 0) {
      return [];
    }

    // 3. Récupérer les profils des fournisseurs
    const supplierIds = Array.from(supplierMap.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, business_name')
      .in('id', supplierIds);

    if (profilesError) {
      console.error('Error fetching supplier profiles:', profilesError);
    }

    // 4. Récupérer les notes moyennes (REQUÊTE CORRIGÉE)
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('to_user_id, overall')
      .eq('to_user_role', 'supplier')
      .in('to_user_id', supplierIds);

    if (ratingsError) {
      console.error('Error fetching supplier ratings:', ratingsError);
      // Continue sans les notes
    }

    // Calculer les notes moyennes par fournisseur
    const ratingMap = new Map<string, { sum: number; count: number }>();
    ratings?.forEach(r => {
      const existing = ratingMap.get(r.to_user_id) || { sum: 0, count: 0 };
      ratingMap.set(r.to_user_id, {
        sum: existing.sum + Number(r.overall),
        count: existing.count + 1
      });
    });

    // 5. Construire le résultat
    const result: TopSupplier[] = [];

    supplierMap.forEach((stats, supplierId) => {
      const profile = profiles?.find(p => p.id === supplierId);
      const ratingData = ratingMap.get(supplierId);
      const averageRating = ratingData ? ratingData.sum / ratingData.count : 0;

      result.push({
        id: supplierId,
        name: profile?.business_name || profile?.name || 'Fournisseur',
        totalRevenue: stats.totalRevenue,
        orderCount: stats.orderCount,
        averageRating: Math.round(averageRating * 10) / 10,
        commissionGenerated: stats.commissionGenerated,
      });
    });

    // 6. Trier par CA décroissant et prendre les 5 premiers
    return result.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit);

  } catch (error) {
    console.error('Error getting top suppliers:', error);
    return [];
  }
}

/**
 * Get top clients by spending
 */
export async function getTopClients(limit: number = 5, year?: number): Promise<TopClient[]> {
  try {
    const startDate = year ? new Date(year, 0, 1).toISOString() : undefined;
    const endDate = year ? new Date(year, 11, 31, 23, 59, 59).toISOString() : undefined;

    // 1. Récupérer les commandes payées avec client_id
    let ordersQuery = supabase
      .from('orders')
      .select('client_id, total_amount, created_at')
      .eq('payment_status', 'paid')
      .not('client_id', 'is', null);

    if (startDate && endDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders for top clients:', ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // 2. Agréger par client
    const clientMap = new Map<string, { 
      totalSpent: number; 
      orderCount: number; 
      lastOrderDate: string 
    }>();

    orders.forEach(order => {
      if (order.client_id) {
        const existing = clientMap.get(order.client_id) || { 
          totalSpent: 0, 
          orderCount: 0, 
          lastOrderDate: '' 
        };
        clientMap.set(order.client_id, {
          totalSpent: existing.totalSpent + (order.total_amount || 0),
          orderCount: existing.orderCount + 1,
          lastOrderDate: order.created_at > existing.lastOrderDate ? order.created_at : existing.lastOrderDate,
        });
      }
    });

    if (clientMap.size === 0) {
      return [];
    }

    // 3. Récupérer les profils des clients
    const clientIds = Array.from(clientMap.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, business_name')
      .in('id', clientIds);

    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
    }

    // 4. Construire le résultat
    const result: TopClient[] = [];

    clientMap.forEach((stats, clientId) => {
      const profile = profiles?.find(p => p.id === clientId);

      result.push({
        id: clientId,
        name: profile?.name || 'Client',
        businessName: profile?.business_name || '',
        totalSpent: stats.totalSpent,
        orderCount: stats.orderCount,
        lastOrderDate: new Date(stats.lastOrderDate),
      });
    });

    // 5. Trier par dépenses décroissantes et prendre les 5 premiers
    return result.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);

  } catch (error) {
    console.error('Error getting top clients:', error);
    return [];
  }
}

/**
 * Generate automatic alerts based on platform health
 */
export async function getAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    // Get recent data for alerts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Check for inactive suppliers (no orders in last 7 days)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('supplier_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('payment_status', 'paid');

    const { data: allSuppliers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'supplier')
      .eq('approval_status', 'approved');

    const activeSupplierIds = new Set(recentOrders?.map(o => o.supplier_id) || []);
    const inactiveSuppliers = (allSuppliers?.length || 0) - activeSupplierIds.size;

    if (inactiveSuppliers > 0) {
      alerts.push({
        type: 'warning',
        title: 'Fournisseurs inactifs',
        message: `${inactiveSuppliers} fournisseur${inactiveSuppliers > 1 ? 's' : ''} n'${inactiveSuppliers > 1 ? 'ont' : 'a'} pas eu de commande depuis 7 jours`,
        metric: inactiveSuppliers
      });
    }

    // Check for pending approvals
    const { data: pendingApprovals } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('approval_status', 'pending');

    if (pendingApprovals && pendingApprovals.length > 0) {
      const suppliersPending = pendingApprovals.filter(p => p.role === 'supplier').length;
      if (suppliersPending > 0) {
        alerts.push({
          type: 'info',
          title: 'Nouvelles demandes',
          message: `${suppliersPending} nouveau${suppliersPending > 1 ? 'x' : ''} fournisseur${suppliersPending > 1 ? 's' : ''} en attente d'approbation`,
          metric: suppliersPending
        });
      }
    }

    // Check cancellation rate increase
    const { data: thisWeekOrders } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: lastWeekOrders } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    const thisWeekCancelled = thisWeekOrders?.filter(o => o.status === 'cancelled').length || 0;
    const thisWeekTotal = thisWeekOrders?.length || 1;
    const thisWeekRate = (thisWeekCancelled / thisWeekTotal) * 100;

    const lastWeekCancelled = lastWeekOrders?.filter(o => o.status === 'cancelled').length || 0;
    const lastWeekTotal = lastWeekOrders?.length || 1;
    const lastWeekRate = (lastWeekCancelled / lastWeekTotal) * 100;

    if (thisWeekRate > lastWeekRate * 1.15 && thisWeekCancelled > 2) { // 15% increase
      const increase = Math.round(((thisWeekRate / lastWeekRate) - 1) * 100);
      alerts.push({
        type: 'danger',
        title: 'Taux d\'annulation en hausse',
        message: `Taux d'annulation en hausse (+${increase}% vs semaine dernière)`,
        metric: increase
      });
    }

    // Check for daily order record
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())
      .eq('payment_status', 'paid');

    const yesterdayCount = yesterdayOrders?.length || 0;

    // Get historical daily average
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historicalOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('payment_status', 'paid');

    const dailyAverage = (historicalOrders?.length || 0) / 30;

    if (yesterdayCount > dailyAverage * 1.5 && yesterdayCount >= 10) {
      alerts.push({
        type: 'info',
        title: 'Record battu !',
        message: `Record battu : ${yesterdayCount} commandes hier !`,
        metric: yesterdayCount
      });
    }

  } catch (error) {
    console.error('Error generating alerts:', error);
  }

  return alerts;
}

/**
 * Calculate growth metrics (MoM and YoY)
 */
export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  try {
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Current year
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const currentYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    
    // Previous year (same period)
    const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const previousYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59);

    // Get current month orders
    const { data: currentMonthOrders } = await supabase
      .from('orders')
      .select('client_commission, supplier_commission')
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString())
      .eq('payment_status', 'paid');

    const currentMonthRevenue = currentMonthOrders?.reduce(
      (sum, o) => sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
    ) || 0;

    // Get previous month orders
    const { data: previousMonthOrders } = await supabase
      .from('orders')
      .select('client_commission, supplier_commission')
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString())
      .eq('payment_status', 'paid');

    const previousMonthRevenue = previousMonthOrders?.reduce(
      (sum, o) => sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
    ) || 0;

    // Calculate MoM growth
    const monthOverMonthGrowth = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

    // Get current year orders
    const { data: currentYearOrders } = await supabase
      .from('orders')
      .select('client_commission, supplier_commission')
      .gte('created_at', currentYearStart.toISOString())
      .lte('created_at', currentYearEnd.toISOString())
      .eq('payment_status', 'paid');

    const currentYearRevenue = currentYearOrders?.reduce(
      (sum, o) => sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
    ) || 0;

    // Get previous year orders (same period)
    const { data: previousYearOrders } = await supabase
      .from('orders')
      .select('client_commission, supplier_commission')
      .gte('created_at', previousYearStart.toISOString())
      .lte('created_at', previousYearEnd.toISOString())
      .eq('payment_status', 'paid');

    const previousYearRevenue = previousYearOrders?.reduce(
      (sum, o) => sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
    ) || 0;

    // Calculate YoY growth
    const yearOverYearGrowth = previousYearRevenue > 0
      ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
      : 0;

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      monthOverMonthGrowth,
      currentYearRevenue,
      previousYearRevenue,
      yearOverYearGrowth
    };
  } catch (error) {
    console.error('Error calculating growth metrics:', error);
    throw error;
  }
}

/**
 * Get order statistics by status
 */
export async function getOrderStats(year: number): Promise<OrderStats> {
  try {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error || !orders) {
      return { delivered: 0, inProgress: 0, cancelled: 0 };
    }

    const delivered = orders.filter(o => o.status === 'delivered').length;
    const inProgress = orders.filter(o => 
      ['pending', 'pending-offers', 'offers-received', 'awaiting-payment', 'paid', 'preparing', 'delivering'].includes(o.status)
    ).length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    return { delivered, inProgress, cancelled };
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    return { delivered: 0, inProgress: 0, cancelled: 0 };
  }
}
