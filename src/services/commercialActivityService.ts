import { supabase } from '../lib/supabase';
import type {
  CommercialActivityStats,
  RegisteredClient,
  CommissionEstimation,
  SalesRepRanking,
  WeeklyStats,
  Period
} from '../types/sales';
import { getDaysLeftInMonth } from '../types/sales';
import { getCommissionSettings } from './salesCommissionService';

/**
 * Get sales representative by user ID
 */
export const getSalesRepByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching sales rep by user ID:', error);
    return null;
  }
};

/**
 * Get commercial activity statistics for a sales rep
 */
export const getCommercialActivityStats = async (
  salesRepId: string,
  period: Period
): Promise<CommercialActivityStats> => {
  try {
    const settings = await getCommissionSettings();
    if (!settings) throw new Error('Commission settings not found');

    // Get all profiles registered by this sales rep
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, name, address, created_at')
      .eq('registered_by_sales_rep_id', salesRepId);

    if (profilesError) throw profilesError;

    const chrProfiles = profiles?.filter(p => p.role === 'client') || [];
    const depotProfiles = profiles?.filter(p => p.role === 'supplier') || [];

    // Calculate activated CHR (CA >= threshold)
    let chrActivated = 0;
    let totalCa = 0;
    
    // Fetch all orders for all CHR profiles in one query
    const chrIds = chrProfiles.map(p => p.id);
    if (chrIds.length > 0) {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('client_id, total_amount')
        .in('client_id', chrIds)
        .eq('status', 'delivered');

      // Group orders by client and calculate CA
      const caByClient = new Map<string, number>();
      allOrders?.forEach(order => {
        const current = caByClient.get(order.client_id) || 0;
        caByClient.set(order.client_id, current + (order.total_amount || 0));
      });

      // Count activated CHR
      chrProfiles.forEach(chr => {
        const ca = caByClient.get(chr.id) || 0;
        totalCa += ca;
        if (ca >= settings.chrActivationThreshold) {
          chrActivated++;
        }
      });
    }

    // Calculate activated Depots (>= N deliveries)
    let depotActivated = 0;
    const depotIds = depotProfiles.map(p => p.id);
    if (depotIds.length > 0) {
      // Fetch delivery counts for all depots in one query
      const { data: deliveryCounts } = await supabase
        .from('orders')
        .select('supplier_id')
        .in('supplier_id', depotIds)
        .eq('status', 'delivered');

      // Count deliveries per depot
      const countByDepot = new Map<string, number>();
      deliveryCounts?.forEach(order => {
        const current = countByDepot.get(order.supplier_id) || 0;
        countByDepot.set(order.supplier_id, current + 1);
      });

      // Count activated depots
      depotProfiles.forEach(depot => {
        const count = countByDepot.get(depot.id) || 0;
        if (count >= settings.depotActivationDeliveries) {
          depotActivated++;
        }
      });
    }

    // Get objectives for this period
    const { data: objective } = await supabase
      .from('sales_objectives')
      .select('*')
      .eq('sales_rep_id', salesRepId)
      .eq('period_year', period.year)
      .eq('period_month', period.month)
      .maybeSingle();

    const objectiveChr = objective?.objective_chr || 0;
    const objectiveDepots = objective?.objective_depots || 0;

    // Calculate percentages
    const percentObjectiveChr = objectiveChr > 0 ? Math.round((chrActivated / objectiveChr) * 100) : 0;
    const percentObjectiveDepots = objectiveDepots > 0 ? Math.round((depotActivated / objectiveDepots) * 100) : 0;

    // Calculate days left in month
    const daysLeftInMonth = getDaysLeftInMonth();

    // Calculate remaining to reach objectives
    const chrRemaining = Math.max(0, objectiveChr - chrActivated);
    const depotRemaining = Math.max(0, objectiveDepots - depotActivated);

    // Calculate activation rate
    const totalRegistered = profiles?.length || 0;
    const totalActivated = chrActivated + depotActivated;
    const activationRate = totalRegistered > 0 ? Math.round((totalActivated / totalRegistered) * 100) : 0;

    // Get weekly stats for current month
    const weeklyStats = await getWeeklyStats(salesRepId, period);

    // Get ranking
    const ranking = await getSalesRepRanking(period);
    const currentRank = ranking.findIndex(r => r.salesRepId === salesRepId) + 1;

    return {
      totalRegistered,
      chrRegistered: chrProfiles.length,
      depotRegistered: depotProfiles.length,
      chrActivated,
      depotActivated,
      totalCa: Math.round(totalCa),
      objectiveChr,
      objectiveDepots,
      percentObjectiveChr,
      percentObjectiveDepots,
      daysLeftInMonth,
      chrRemaining,
      depotRemaining,
      activationRate,
      weeklyStats,
      ranking,
      currentRank
    };
  } catch (error) {
    console.error('Error fetching commercial activity stats:', error);
    throw error;
  }
};

/**
 * Get weekly registration statistics for a period
 */
const getWeeklyStats = async (salesRepId: string, period: Period): Promise<WeeklyStats[]> => {
  try {
    // Get all registrations for the month
    const startDate = new Date(period.year, period.month - 1, 1);
    const endDate = new Date(period.year, period.month, 0, 23, 59, 59);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('registered_by_sales_rep_id', salesRepId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group by week
    const weekCounts = new Map<number, number>();
    profiles?.forEach(profile => {
      const date = new Date(profile.created_at);
      const weekNumber = Math.ceil(date.getDate() / 7);
      weekCounts.set(weekNumber, (weekCounts.get(weekNumber) || 0) + 1);
    });

    // Create weekly stats array
    const weeks: WeeklyStats[] = [];
    for (let i = 1; i <= 4; i++) {
      weeks.push({
        weekNumber: i,
        weekLabel: `S${i}`,
        registrations: weekCounts.get(i) || 0
      });
    }

    return weeks;
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return [];
  }
};

/**
 * Get sales rep ranking for a period
 */
const getSalesRepRanking = async (period: Period): Promise<SalesRepRanking[]> => {
  try {
    // Get all active sales reps
    const { data: reps } = await supabase
      .from('sales_representatives')
      .select('id, name')
      .eq('is_active', true);

    if (!reps || reps.length === 0) return [];

    // Date range for the period
    const startDate = new Date(period.year, period.month - 1, 1);
    const endDate = new Date(period.year, period.month, 0, 23, 59, 59);

    // Fetch all registrations for all sales reps in one query
    const { data: registrations } = await supabase
      .from('profiles')
      .select('registered_by_sales_rep_id')
      .not('registered_by_sales_rep_id', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count registrations per sales rep
    const countsByRep = new Map<string, number>();
    registrations?.forEach(reg => {
      const repId = reg.registered_by_sales_rep_id;
      if (repId) {
        countsByRep.set(repId, (countsByRep.get(repId) || 0) + 1);
      }
    });

    // Build ranking
    const ranking: SalesRepRanking[] = reps.map(rep => ({
      salesRepId: rep.id,
      salesRepName: rep.name,
      totalRegistered: countsByRep.get(rep.id) || 0,
      rank: 0 // Will be set after sorting
    }));

    // Sort by total registered (descending)
    ranking.sort((a, b) => b.totalRegistered - a.totalRegistered);

    // Assign ranks
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });

    return ranking;
  } catch (error) {
    console.error('Error fetching sales rep ranking:', error);
    return [];
  }
};

/**
 * Get list of registered clients for a sales rep
 */
export const getRegisteredClients = async (salesRepId: string): Promise<RegisteredClient[]> => {
  try {
    const settings = await getCommissionSettings();
    if (!settings) throw new Error('Commission settings not found');

    // Get all profiles registered by this sales rep
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role, name, address, created_at')
      .eq('registered_by_sales_rep_id', salesRepId)
      .order('created_at', { ascending: false });

    if (!profiles) return [];

    const clients: RegisteredClient[] = [];
    
    // Separate CHR and depots
    const chrProfiles = profiles.filter(p => p.role === 'client');
    const depotProfiles = profiles.filter(p => p.role === 'supplier');

    // Fetch all orders for CHR profiles in one query
    const caByClient = new Map<string, number>();
    const chrIds = chrProfiles.map(p => p.id);
    if (chrIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('client_id, total_amount')
        .in('client_id', chrIds)
        .eq('status', 'delivered');

      orders?.forEach(order => {
        const current = caByClient.get(order.client_id) || 0;
        caByClient.set(order.client_id, current + (order.total_amount || 0));
      });
    }

    // Fetch all deliveries for depot profiles in one query
    const deliveriesByDepot = new Map<string, number>();
    const depotIds = depotProfiles.map(p => p.id);
    if (depotIds.length > 0) {
      const { data: deliveries } = await supabase
        .from('orders')
        .select('supplier_id')
        .in('supplier_id', depotIds)
        .eq('status', 'delivered');

      deliveries?.forEach(order => {
        const current = deliveriesByDepot.get(order.supplier_id) || 0;
        deliveriesByDepot.set(order.supplier_id, current + 1);
      });
    }

    // Build client list with calculated stats
    for (const profile of profiles) {
      let totalCa = 0;
      let totalDeliveries = 0;
      let isActivated = false;
      let activationProgress = 0;

      if (profile.role === 'client') {
        // CHR: Check CA
        totalCa = caByClient.get(profile.id) || 0;
        isActivated = totalCa >= settings.chrActivationThreshold;
        activationProgress = Math.min(100, Math.round((totalCa / settings.chrActivationThreshold) * 100));
      } else if (profile.role === 'supplier') {
        // Depot: Check deliveries
        totalDeliveries = deliveriesByDepot.get(profile.id) || 0;
        isActivated = totalDeliveries >= settings.depotActivationDeliveries;
        activationProgress = Math.min(100, Math.round((totalDeliveries / settings.depotActivationDeliveries) * 100));
      }

      clients.push({
        id: profile.id,
        name: profile.name,
        role: profile.role as 'client' | 'supplier',
        address: profile.address,
        registeredAt: new Date(profile.created_at),
        totalCa,
        totalDeliveries,
        isActivated,
        activationProgress
      });
    }

    return clients;
  } catch (error) {
    console.error('Error fetching registered clients:', error);
    throw error;
  }
};

/**
 * Calculate commission estimation for a sales rep in current period
 */
export const calculateCommissionEstimation = async (
  salesRepId: string,
  period: Period
): Promise<CommissionEstimation> => {
  try {
    const settings = await getCommissionSettings();
    if (!settings) throw new Error('Commission settings not found');

    const stats = await getCommercialActivityStats(salesRepId, period);

    // Prime inscriptions
    const primeChrTotal = stats.chrActivated * settings.primePerChrActivated;
    const primeDepotTotal = stats.depotActivated * settings.primePerDepotActivated;
    const primeInscriptionsTotal = primeChrTotal + primeDepotTotal;

    // Bonus objectifs
    let bonusChrObjective = 0;
    let bonusDepotObjective = 0;
    let bonusCombined = 0;

    const chrObjectiveReached = stats.chrActivated >= stats.objectiveChr && stats.objectiveChr > 0;
    const depotObjectiveReached = stats.depotActivated >= stats.objectiveDepots && stats.objectiveDepots > 0;

    if (chrObjectiveReached && depotObjectiveReached) {
      bonusChrObjective = settings.bonusChrObjective;
      bonusDepotObjective = settings.bonusDepotObjective;
      bonusCombined = settings.bonusCombined;
    } else if (chrObjectiveReached) {
      bonusChrObjective = settings.bonusChrObjective;
    } else if (depotObjectiveReached) {
      bonusDepotObjective = settings.bonusDepotObjective;
    }

    const bonusObjectivesTotal = bonusChrObjective + bonusDepotObjective + bonusCombined;

    // Bonus dépassement
    let bonusOvershoot = 0;
    if (stats.objectiveChr > 0 && stats.objectiveDepots > 0) {
      const totalObjective = stats.objectiveChr + stats.objectiveDepots;
      const totalRealized = stats.chrActivated + stats.depotActivated;
      const percent = (totalRealized / totalObjective) * 100;

      if (percent >= settings.overshootTier2Threshold) {
        bonusOvershoot = settings.overshootTier2Bonus;
      } else if (percent >= settings.overshootTier1Threshold) {
        bonusOvershoot = settings.overshootTier1Bonus;
      }
    }

    // Commission CA (if enabled)
    let commissionCa = 0;
    if (settings.caCommissionEnabled) {
      const ca = stats.totalCa;
      if (ca > settings.caTier3Max) {
        commissionCa = Math.round(ca * settings.caTier4Rate / 100);
      } else if (ca > settings.caTier2Max) {
        commissionCa = Math.round(ca * settings.caTier3Rate / 100);
      } else if (ca > settings.caTier1Max) {
        commissionCa = Math.round(ca * settings.caTier2Rate / 100);
      } else {
        commissionCa = Math.round(ca * settings.caTier1Rate / 100);
      }
    }

    // Total
    const totalEstimated = primeInscriptionsTotal + bonusObjectivesTotal + bonusOvershoot + commissionCa;

    // Payment date (5th of next month)
    const estimatedPaymentDate = new Date(period.year, period.month, 5);

    return {
      chrActivated: stats.chrActivated,
      primePerChr: settings.primePerChrActivated,
      primeChrTotal,
      depotActivated: stats.depotActivated,
      primePerDepot: settings.primePerDepotActivated,
      primeDepotTotal,
      primeInscriptionsTotal,
      bonusChrObjective,
      bonusDepotObjective,
      bonusCombined,
      bonusObjectivesTotal,
      bonusOvershoot,
      commissionCa,
      totalEstimated,
      estimatedPaymentDate
    };
  } catch (error) {
    console.error('Error calculating commission estimation:', error);
    throw error;
  }
};

/**
 * Get payment history for a sales rep
 */
export const getPaymentHistory = async (salesRepId: string): Promise<any[]> => {
  try {
    const { data: payments } = await supabase
      .from('sales_commission_payments')
      .select('*')
      .eq('sales_rep_id', salesRepId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(12);

    return payments || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};
