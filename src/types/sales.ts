// ============================================
// SALES COMMISSION TYPES
// ============================================

/**
 * Sales Representative from the database
 */
export interface SalesRepresentative {
  id: string;
  userId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  zoneId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sales Objective for a specific period
 */
export interface SalesObjective {
  id: string;
  salesRepId: string;
  periodYear: number;
  periodMonth: number;
  objectiveChr: number;
  objectiveDepots: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

/**
 * Sales Commission Settings (singleton configuration)
 */
export interface SalesCommissionSettings {
  id: string;
  // Primes inscription
  primePerChrActivated: number;
  chrActivationThreshold: number;
  primePerDepotActivated: number;
  depotActivationDeliveries: number;
  // Commission CA
  caCommissionEnabled: boolean;
  caTier1Max: number;
  caTier1Rate: number;
  caTier2Max: number;
  caTier2Rate: number;
  caTier3Max: number;
  caTier3Rate: number;
  caTier4Rate: number;
  // Bonus objectifs
  bonusChrObjective: number;
  bonusDepotObjective: number;
  bonusCombined: number;
  // Bonus dépassement
  overshootTier1Threshold: number;
  overshootTier1Bonus: number;
  overshootTier2Threshold: number;
  overshootTier2Bonus: number;
  // Bonus spéciaux
  bonusBestOfMonth: number;
  // Audit
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * Sales Commission Payment Status
 */
export type PaymentStatus = 'pending' | 'validated' | 'paid';

/**
 * Sales Commission Payment record
 */
export interface SalesCommissionPayment {
  id: string;
  periodYear: number;
  periodMonth: number;
  salesRepId: string;
  // Détail
  chrActivated: number;
  depotActivated: number;
  primeInscriptions: number;
  bonusObjectives: number;
  bonusOvershoot: number;
  bonusSpecial: number;
  commissionCa: number;
  // Total
  totalAmount: number;
  // Status
  status: PaymentStatus;
  validatedAt: Date | null;
  validatedBy: string | null;
  paidAt: Date | null;
  paidBy: string | null;
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sales Representative with performance metrics
 */
export interface SalesRepWithMetrics extends SalesRepresentative {
  zoneName?: string;
  totalRegistered: number;
  chrRegistered: number;
  depotRegistered: number;
  chrActivated: number;
  depotActivated: number;
  totalCa: number;
  objectiveChr?: number;
  objectiveDepots?: number;
  percentObjectiveChr?: number;
  percentObjectiveDepots?: number;
}

/**
 * Dashboard KPI metrics
 */
export interface DashboardKPIs {
  totalRegistered: number;
  depotsRegistered: number;
  chrRegistered: number;
  totalCa: number;
  activeRate: number; // % of clients with at least 1 order
}

/**
 * Period selector (year + month)
 */
export interface Period {
  year: number;
  month: number;
}

/**
 * Commission calculation result for a sales rep
 */
export interface CommissionCalculation {
  salesRepId: string;
  salesRepName: string;
  chrActivated: number;
  depotActivated: number;
  primeInscriptions: number;
  bonusObjectives: number;
  bonusOvershoot: number;
  bonusSpecial: number;
  commissionCa: number;
  totalAmount: number;
}

/**
 * Full commission calculation for a period
 */
export interface PeriodCommissionCalculation {
  period: Period;
  calculations: CommissionCalculation[];
  totalAmount: number;
  bestSalesRepId: string | null;
}

/**
 * Historical payment summary
 */
export interface PaymentHistorySummary {
  period: Period;
  salesRepsCount: number;
  totalAmount: number;
  status: PaymentStatus;
  paidAt: Date | null;
}

// Constants
export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  paid: 'Payé'
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800'
};

/**
 * Helper to format period as string
 */
export const formatPeriod = (period: Period): string => {
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`;
};

/**
 * Helper to get current period
 */
export const getCurrentPeriod = (): Period => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

/**
 * Helper to format currency (FCFA)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' F';
};
