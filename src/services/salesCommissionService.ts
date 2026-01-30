import { supabase } from '../lib/supabase';
import type {
  SalesRepresentative,
  SalesObjective,
  SalesCommissionSettings,
  SalesCommissionPayment,
  SalesRepWithMetrics,
  DashboardKPIs,
  Period,
  CommissionCalculation,
  PeriodCommissionCalculation
} from '../types/sales';

// ============================================
// TRANSFORMATION HELPERS
// ============================================

const transformSalesRep = (data: Record<string, unknown>): SalesRepresentative => ({
  id: data.id as string,
  userId: data.user_id as string | null,
  name: data.name as string,
  phone: data.phone as string | null,
  email: data.email as string | null,
  zoneId: data.zone_id as string | null,
  isActive: data.is_active as boolean,
  createdAt: new Date(data.created_at as string),
  updatedAt: new Date(data.updated_at as string)
});

const transformObjective = (data: Record<string, unknown>): SalesObjective => ({
  id: data.id as string,
  salesRepId: data.sales_rep_id as string,
  periodYear: data.period_year as number,
  periodMonth: data.period_month as number,
  objectiveChr: data.objective_chr as number,
  objectiveDepots: data.objective_depots as number,
  createdAt: new Date(data.created_at as string),
  updatedAt: new Date(data.updated_at as string),
  createdBy: data.created_by as string | null
});

const transformSettings = (data: Record<string, unknown>): SalesCommissionSettings => ({
  id: data.id as string,
  primePerChrActivated: data.prime_per_chr_activated as number,
  chrActivationThreshold: data.chr_activation_threshold as number,
  primePerDepotActivated: data.prime_per_depot_activated as number,
  depotActivationDeliveries: data.depot_activation_deliveries as number,
  caCommissionEnabled: data.ca_commission_enabled as boolean,
  caTier1Max: data.ca_tier1_max as number,
  caTier1Rate: data.ca_tier1_rate as number,
  caTier2Max: data.ca_tier2_max as number,
  caTier2Rate: data.ca_tier2_rate as number,
  caTier3Max: data.ca_tier3_max as number,
  caTier3Rate: data.ca_tier3_rate as number,
  caTier4Rate: data.ca_tier4_rate as number,
  bonusChrObjective: data.bonus_chr_objective as number,
  bonusDepotObjective: data.bonus_depot_objective as number,
  bonusCombined: data.bonus_combined as number,
  overshootTier1Threshold: data.overshoot_tier1_threshold as number,
  overshootTier1Bonus: data.overshoot_tier1_bonus as number,
  overshootTier2Threshold: data.overshoot_tier2_threshold as number,
  overshootTier2Bonus: data.overshoot_tier2_bonus as number,
  bonusBestOfMonth: data.bonus_best_of_month as number,
  updatedAt: new Date(data.updated_at as string),
  updatedBy: data.updated_by as string | null
});

const transformPayment = (data: Record<string, unknown>): SalesCommissionPayment => ({
  id: data.id as string,
  periodYear: data.period_year as number,
  periodMonth: data.period_month as number,
  salesRepId: data.sales_rep_id as string,
  chrActivated: data.chr_activated as number,
  depotActivated: data.depot_activated as number,
  primeInscriptions: data.prime_inscriptions as number,
  bonusObjectives: data.bonus_objectives as number,
  bonusOvershoot: data.bonus_overshoot as number,
  bonusSpecial: data.bonus_special as number,
  commissionCa: data.commission_ca as number,
  totalAmount: data.total_amount as number,
  status: data.status as 'pending' | 'validated' | 'paid',
  validatedAt: data.validated_at ? new Date(data.validated_at as string) : null,
  validatedBy: data.validated_by as string | null,
  paidAt: data.paid_at ? new Date(data.paid_at as string) : null,
  paidBy: data.paid_by as string | null,
  createdAt: new Date(data.created_at as string),
  updatedAt: new Date(data.updated_at as string)
});

// ============================================
// SALES REPRESENTATIVES
// ============================================

export const getSalesRepresentatives = async (): Promise<SalesRepresentative[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(transformSalesRep);
  } catch (error) {
    console.error('Error fetching sales representatives:', error);
    throw error;
  }
};

export const getActiveSalesRepresentatives = async (): Promise<SalesRepresentative[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []).map(transformSalesRep);
  } catch (error) {
    console.error('Error fetching active sales representatives:', error);
    throw error;
  }
};

// ============================================
// OBJECTIVES
// ============================================

export const getObjectivesByPeriod = async (period: Period): Promise<SalesObjective[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_objectives')
      .select('*')
      .eq('period_year', period.year)
      .eq('period_month', period.month);

    if (error) throw error;
    return (data || []).map(transformObjective);
  } catch (error) {
    console.error('Error fetching objectives:', error);
    throw error;
  }
};

export const createOrUpdateObjective = async (
  objective: Omit<SalesObjective, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SalesObjective> => {
  try {
    const { data, error } = await supabase
      .from('sales_objectives')
      .upsert({
        sales_rep_id: objective.salesRepId,
        period_year: objective.periodYear,
        period_month: objective.periodMonth,
        objective_chr: objective.objectiveChr,
        objective_depots: objective.objectiveDepots,
        created_by: objective.createdBy
      }, {
        onConflict: 'sales_rep_id,period_year,period_month'
      })
      .select()
      .single();

    if (error) throw error;
    return transformObjective(data);
  } catch (error) {
    console.error('Error creating/updating objective:', error);
    throw error;
  }
};

export const deleteObjective = async (objectiveId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales_objectives')
      .delete()
      .eq('id', objectiveId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting objective:', error);
    throw error;
  }
};

// ============================================
// COMMISSION SETTINGS
// ============================================

export const getCommissionSettings = async (): Promise<SalesCommissionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('sales_commission_settings')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows
      throw error;
    }
    return transformSettings(data);
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    throw error;
  }
};

export const updateCommissionSettings = async (
  settings: Partial<SalesCommissionSettings>,
  userId: string
): Promise<SalesCommissionSettings> => {
  try {
    // Get the existing settings first
    const existing = await getCommissionSettings();
    if (!existing) throw new Error('No commission settings found');

    const { data, error } = await supabase
      .from('sales_commission_settings')
      .update({
        prime_per_chr_activated: settings.primePerChrActivated,
        chr_activation_threshold: settings.chrActivationThreshold,
        prime_per_depot_activated: settings.primePerDepotActivated,
        depot_activation_deliveries: settings.depotActivationDeliveries,
        ca_commission_enabled: settings.caCommissionEnabled,
        ca_tier1_max: settings.caTier1Max,
        ca_tier1_rate: settings.caTier1Rate,
        ca_tier2_max: settings.caTier2Max,
        ca_tier2_rate: settings.caTier2Rate,
        ca_tier3_max: settings.caTier3Max,
        ca_tier3_rate: settings.caTier3Rate,
        ca_tier4_rate: settings.caTier4Rate,
        bonus_chr_objective: settings.bonusChrObjective,
        bonus_depot_objective: settings.bonusDepotObjective,
        bonus_combined: settings.bonusCombined,
        overshoot_tier1_threshold: settings.overshootTier1Threshold,
        overshoot_tier1_bonus: settings.overshootTier1Bonus,
        overshoot_tier2_threshold: settings.overshootTier2Threshold,
        overshoot_tier2_bonus: settings.overshootTier2Bonus,
        bonus_best_of_month: settings.bonusBestOfMonth,
        updated_by: userId
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return transformSettings(data);
  } catch (error) {
    console.error('Error updating commission settings:', error);
    throw error;
  }
};

// ============================================
// COMMISSION PAYMENTS
// ============================================

export const getPaymentsByPeriod = async (period: Period): Promise<SalesCommissionPayment[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_commission_payments')
      .select('*')
      .eq('period_year', period.year)
      .eq('period_month', period.month);

    if (error) throw error;
    return (data || []).map(transformPayment);
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const getPaymentHistory = async (): Promise<SalesCommissionPayment[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_commission_payments')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformPayment);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

export const createOrUpdatePayment = async (
  payment: Omit<SalesCommissionPayment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SalesCommissionPayment> => {
  try {
    const { data, error } = await supabase
      .from('sales_commission_payments')
      .upsert({
        period_year: payment.periodYear,
        period_month: payment.periodMonth,
        sales_rep_id: payment.salesRepId,
        chr_activated: payment.chrActivated,
        depot_activated: payment.depotActivated,
        prime_inscriptions: payment.primeInscriptions,
        bonus_objectives: payment.bonusObjectives,
        bonus_overshoot: payment.bonusOvershoot,
        bonus_special: payment.bonusSpecial,
        commission_ca: payment.commissionCa,
        total_amount: payment.totalAmount,
        status: payment.status,
        validated_at: payment.validatedAt,
        validated_by: payment.validatedBy,
        paid_at: payment.paidAt,
        paid_by: payment.paidBy
      }, {
        onConflict: 'period_year,period_month,sales_rep_id'
      })
      .select()
      .single();

    if (error) throw error;
    return transformPayment(data);
  } catch (error) {
    console.error('Error creating/updating payment:', error);
    throw error;
  }
};

export const validatePayments = async (
  period: Period,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales_commission_payments')
      .update({
        status: 'validated',
        validated_at: new Date().toISOString(),
        validated_by: userId
      })
      .eq('period_year', period.year)
      .eq('period_month', period.month)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error validating payments:', error);
    throw error;
  }
};

export const markPaymentsAsPaid = async (
  period: Period,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales_commission_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: userId
      })
      .eq('period_year', period.year)
      .eq('period_month', period.month)
      .eq('status', 'validated');

    if (error) throw error;
  } catch (error) {
    console.error('Error marking payments as paid:', error);
    throw error;
  }
};

// ============================================
// DASHBOARD & METRICS
// ============================================

/**
 * Get dashboard KPIs for a specific period
 * 
 * NOTE: Period parameter is reserved for future filtering by date ranges.
 * Currently returns global statistics regardless of period.
 * 
 * TODO: Implement period-based filtering when date tracking is added to profiles
 * TODO: Optimize using SQL aggregations instead of fetching all data into memory
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDashboardKPIs = async (_period: Period): Promise<DashboardKPIs> => {
  try {
    // Total registered by sales reps
    const { count: totalRegistered } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('registered_by_sales_rep_id', 'is', null);

    // Depots registered
    const { count: depotsRegistered } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'supplier')
      .not('registered_by_sales_rep_id', 'is', null);

    // CHR registered
    const { count: chrRegistered } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'client')
      .not('registered_by_sales_rep_id', 'is', null);

    // Calculate total CA for clients registered by sales reps
    // This is a simplified version - in production you'd use a more optimized query
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_amount, client_id')
      .eq('status', 'delivered');

    const { data: clientsData } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .not('registered_by_sales_rep_id', 'is', null);

    const clientIds = new Set(clientsData?.map(c => c.id) || []);
    const totalCa = (ordersData || [])
      .filter(o => clientIds.has(o.client_id))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Calculate active rate (clients with at least 1 order)
    const clientsWithOrders = new Set(ordersData?.map(o => o.client_id) || []);
    const activeClients = [...clientIds].filter(id => clientsWithOrders.has(id)).length;
    const activeRate = chrRegistered ? (activeClients / chrRegistered) * 100 : 0;

    return {
      totalRegistered: totalRegistered || 0,
      depotsRegistered: depotsRegistered || 0,
      chrRegistered: chrRegistered || 0,
      totalCa: Math.round(totalCa),
      activeRate: Math.round(activeRate * 10) / 10
    };
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw error;
  }
};

/**
 * Get sales rep performance metrics for a period
 * 
 * NOTE: This function has N+1 query performance issues. Each sales rep triggers multiple
 * database queries for profiles, orders, and zones. This should be optimized using SQL JOINs
 * and aggregations when dealing with many sales reps or large datasets.
 * 
 * TODO: Refactor to use a single query with JOINs and GROUP BY for better performance
 */
export const getSalesRepsWithMetrics = async (period: Period): Promise<SalesRepWithMetrics[]> => {
  try {
    const reps = await getActiveSalesRepresentatives();
    const objectives = await getObjectivesByPeriod(period);
    const settings = await getCommissionSettings();

    if (!settings) throw new Error('Commission settings not found');

    const repsWithMetrics: SalesRepWithMetrics[] = [];

    for (const rep of reps) {
      // Get profiles registered by this rep
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('registered_by_sales_rep_id', rep.id);

      const chrProfiles = profiles?.filter(p => p.role === 'client') || [];
      const depotProfiles = profiles?.filter(p => p.role === 'supplier') || [];

      // Calculate activated CHR (CA >= threshold)
      let chrActivated = 0;
      for (const chr of chrProfiles) {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('client_id', chr.id)
          .eq('status', 'delivered');

        const totalCa = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        if (totalCa >= settings.chrActivationThreshold) {
          chrActivated++;
        }
      }

      // Calculate activated Depots (>= N deliveries)
      let depotActivated = 0;
      for (const depot of depotProfiles) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', depot.id)
          .eq('status', 'delivered');

        if ((count || 0) >= settings.depotActivationDeliveries) {
          depotActivated++;
        }
      }

      // Calculate total CA generated by this rep's clients
      let totalCa = 0;
      for (const chr of chrProfiles) {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('client_id', chr.id)
          .eq('status', 'delivered');

        totalCa += orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      }

      // Find objective for this rep
      const objective = objectives.find(o => o.salesRepId === rep.id);

      // Get zone name if available
      let zoneName: string | undefined;
      if (rep.zoneId) {
        const { data: zone } = await supabase
          .from('zones')
          .select('name')
          .eq('id', rep.zoneId)
          .single();
        zoneName = zone?.name;
      }

      repsWithMetrics.push({
        ...rep,
        zoneName,
        totalRegistered: profiles?.length || 0,
        chrRegistered: chrProfiles.length,
        depotRegistered: depotProfiles.length,
        chrActivated,
        depotActivated,
        totalCa: Math.round(totalCa),
        objectiveChr: objective?.objectiveChr,
        objectiveDepots: objective?.objectiveDepots,
        percentObjectiveChr: objective ? Math.round((chrActivated / objective.objectiveChr) * 100) : undefined,
        percentObjectiveDepots: objective ? Math.round((depotActivated / objective.objectiveDepots) * 100) : undefined
      });
    }

    return repsWithMetrics;
  } catch (error) {
    console.error('Error fetching sales reps with metrics:', error);
    throw error;
  }
};

/**
 * Calculate commissions for a period
 */
export const calculateCommissions = async (period: Period): Promise<PeriodCommissionCalculation> => {
  try {
    const repsWithMetrics = await getSalesRepsWithMetrics(period);
    const settings = await getCommissionSettings();

    if (!settings) throw new Error('Commission settings not found');

    const calculations: CommissionCalculation[] = [];

    for (const rep of repsWithMetrics) {
      // Prime inscriptions
      const primeInscriptions = 
        (rep.chrActivated * settings.primePerChrActivated) +
        (rep.depotActivated * settings.primePerDepotActivated);

      // Bonus objectives
      let bonusObjectives = 0;
      const chrObjectiveReached = rep.objectiveChr && rep.chrActivated >= rep.objectiveChr;
      const depotObjectiveReached = rep.objectiveDepots && rep.depotActivated >= rep.objectiveDepots;

      if (chrObjectiveReached && depotObjectiveReached) {
        bonusObjectives = settings.bonusChrObjective + settings.bonusDepotObjective + settings.bonusCombined;
      } else if (chrObjectiveReached) {
        bonusObjectives = settings.bonusChrObjective;
      } else if (depotObjectiveReached) {
        bonusObjectives = settings.bonusDepotObjective;
      }

      // Bonus dépassement
      let bonusOvershoot = 0;
      if (rep.objectiveChr && rep.objectiveDepots) {
        const totalObjective = rep.objectiveChr + rep.objectiveDepots;
        const totalRealized = rep.chrActivated + rep.depotActivated;
        
        // Only calculate if totalObjective is greater than 0
        if (totalObjective > 0) {
          const percent = (totalRealized / totalObjective) * 100;

          if (percent >= settings.overshootTier2Threshold) {
            bonusOvershoot = settings.overshootTier2Bonus;
          } else if (percent >= settings.overshootTier1Threshold) {
            bonusOvershoot = settings.overshootTier1Bonus;
          }
        }
      }

      // Commission CA (if enabled)
      let commissionCa = 0;
      if (settings.caCommissionEnabled) {
        const ca = rep.totalCa;
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

      const totalAmount = primeInscriptions + bonusObjectives + bonusOvershoot + commissionCa;

      calculations.push({
        salesRepId: rep.id,
        salesRepName: rep.name,
        chrActivated: rep.chrActivated,
        depotActivated: rep.depotActivated,
        primeInscriptions,
        bonusObjectives,
        bonusOvershoot,
        bonusSpecial: 0, // Will be set for best rep
        commissionCa,
        totalAmount
      });
    }

    // Find best sales rep (highest total)
    let bestSalesRepId: string | null = null;
    let maxTotal = 0;
    calculations.forEach(calc => {
      if (calc.totalAmount > maxTotal) {
        maxTotal = calc.totalAmount;
        bestSalesRepId = calc.salesRepId;
      }
    });

    // Add special bonus to best rep
    if (bestSalesRepId) {
      const bestCalc = calculations.find(c => c.salesRepId === bestSalesRepId);
      if (bestCalc) {
        bestCalc.bonusSpecial = settings.bonusBestOfMonth;
        bestCalc.totalAmount += settings.bonusBestOfMonth;
      }
    }

    const totalAmount = calculations.reduce((sum, c) => sum + c.totalAmount, 0);

    return {
      period,
      calculations,
      totalAmount,
      bestSalesRepId
    };
  } catch (error) {
    console.error('Error calculating commissions:', error);
    throw error;
  }
};
