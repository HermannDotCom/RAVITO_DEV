import { Product } from './index';

/**
 * Activity Management Module Types
 * For CHR (Maquis, Bars, Restaurants) daily tracking
 */

// ============================================
// ESTABLISHMENT PRODUCTS
// ============================================
export interface EstablishmentProduct {
  id: string;
  organizationId: string;
  productId: string;
  sellingPrice: number; // Prix de vente au client final (FCFA)
  isActive: boolean;
  minStockAlert: number;
  createdAt: string;
  updatedAt: string;
  product?: Product; // Jointure optionnelle
}

// ============================================
// DAILY SHEET
// ============================================
export interface DailySheet {
  id: string;
  organizationId: string;
  sheetDate: string; // DATE format YYYY-MM-DD
  status: 'open' | 'closed';
  openingCash: number; // Fond de caisse matin (FCFA)
  closingCash?: number; // Montant compté le soir (FCFA)
  theoreticalRevenue: number; // CA théorique calculé
  cashDifference?: number; // Écart de caisse (closing - theoretical - expenses + opening)
  expensesTotal: number;
  creditSales?: number; // Total des crédits accordés ce jour
  creditPayments?: number; // Total des règlements crédits reçus ce jour
  creditBalanceEod?: number; // Solde total crédit en fin de journée
  notes?: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DAILY STOCK LINE
// ============================================
export interface DailyStockLine {
  id: string;
  dailySheetId: string;
  productId: string;
  initialStock: number; // Auto-reporté de J-1
  ravitoSupply: number; // Auto: commandes RAVITO livrées ce jour
  externalSupply: number; // Manuel: achats hors RAVITO
  finalStock?: number; // Saisie manuelle le soir
  createdAt: string;
  updatedAt: string;
  
  // Calculated fields (frontend only)
  totalSupply?: number; // ravitoSupply + externalSupply
  salesQty?: number; // initialStock + totalSupply - finalStock
  revenue?: number; // salesQty * sellingPrice
  
  // Jointures optionnelles
  product?: Product;
  establishmentProduct?: EstablishmentProduct | { sellingPrice: number };
}

// ============================================
// DAILY PACKAGING
// ============================================
export interface DailyPackaging {
  id: string;
  dailySheetId: string;
  crateType: string; // B33=24x33cl, B65=12x65cl, B100=Bock 100cl, B50V=Vin 50cl, B100V=Vin 100cl
  qtyFullStart: number; // Casiers pleins matin
  qtyEmptyStart: number; // Casiers vides matin
  qtyReceived: number; // Casiers reçus (livraisons RAVITO)
  qtyReturned: number; // Casiers rendus aux fournisseurs
  qtyConsignesPaid: number; // Nombre de casiers dont la consigne a été payée
  qtyFullEnd?: number; // Casiers pleins soir (saisie manuelle)
  qtyEmptyEnd?: number; // Casiers vides soir (saisie manuelle)
  notes?: string; // Observations libres (casse, vol, perte, etc.)
  createdAt: string;
  updatedAt: string;
  
  // Calculated fields (frontend only)
  totalStart?: number; // qtyFullStart + qtyEmptyStart
  totalEnd?: number; // qtyFullEnd + qtyEmptyEnd
  difference?: number; // totalEnd - totalStart (should be 0, else ALERT)
  theoreticalFullEnd?: number; // qtyFullStart + qtyReceived - qtyReturned
  theoreticalEmptyEnd?: number; // qtyEmptyStart
}

// ============================================
// DAILY EXPENSE
// ============================================
export interface DailyExpense {
  id: string;
  dailySheetId: string;
  label: string; // "Glaçons", "Taxi", "Électricité", etc.
  amount: number; // Montant en FCFA
  category: 'food' | 'transport' | 'utilities' | 'other';
  createdAt: string;
}

// ============================================
// ACTIVITY TAB TYPE
// ============================================
export type ActivityTab = 'stocks' | 'credits' | 'packaging' | 'cash' | 'summary' | 'monthly' | 'annual';

// ============================================
// HELPER TYPES FOR CALCULATIONS
// ============================================
export interface StockCalculations {
  totalSupply: number;
  salesQty: number;
  revenue: number;
}

export interface PackagingCalculations {
  totalStart: number;
  totalEnd: number;
  difference: number;
  theoreticalFullEnd: number;
  theoreticalEmptyEnd: number;
  hasDiscrepancy: boolean;
}

export interface CashCalculations {
  theoreticalRevenue: number;
  expensesTotal: number;
  expectedCash: number; // openingCash + theoreticalRevenue - expensesTotal
  actualCash: number; // closingCash
  cashDifference: number; // actualCash - expectedCash
}

// ============================================
// DAILY SUMMARY
// ============================================
export interface DailySummary {
  sheet: DailySheet;
  stockLines: DailyStockLine[];
  packaging: DailyPackaging[];
  expenses: DailyExpense[];
  calculations: {
    totalRevenue: number;
    totalExpenses: number;
    cashDifference: number;
    stockAlerts: {
      productId: string;
      productName: string;
      currentStock: number;
      minStock: number;
    }[];
    packagingAlerts: {
      crateType: string;
      difference: number;
      message: string;
    }[];
  };
}

// ============================================
// FORM DATA TYPES
// ============================================
export interface UpdateStockLineData {
  externalSupply?: number;
  finalStock?: number;
}

export interface UpdatePackagingData {
  qtyFullStart?: number;  // Éditable jour 1
  qtyEmptyStart?: number;  // Éditable jour 1
  qtyConsignesPaid?: number;  // Consignes payées
  qtyFullEnd?: number;
  qtyEmptyEnd?: number;
  notes?: string;  // Observations
}

export interface AddExpenseData {
  label: string;
  amount: number;
  category: 'food' | 'transport' | 'utilities' | 'other';
}

export interface CloseSheetData {
  closingCash: number;
  notes?: string;
}

export interface UpsertEstablishmentProductData {
  organizationId: string;
  productId: string;
  sellingPrice: number;
  isActive?: boolean;
  minStockAlert?: number;
}

// ============================================
// CATEGORY LABELS (for UI)
// ============================================
export const EXPENSE_CATEGORIES = {
  food: 'Alimentation / Nourriture',
  transport: 'Transport',
  utilities: 'Services publics (électricité, eau, etc.)',
  other: 'Autre',
} as const;

export const CRATE_TYPE_LABELS = {
  B33: 'Casier 33cl/30cl (24 bout.)',    // Ex C24
  B65: 'Casier 65cl/50cl (12 bout.)',    // Ex C12
  B100: 'Casier Bock 100cl',              // Bock uniquement
  B50V: 'Casier Vin 50cl',                // Valpière 50cl
  B100V: 'Casier Vin 100cl',              // Valpière 100cl
} as const;

// ============================================
// MONTHLY CLOSURE TYPES
// ============================================
export interface MonthlyKPIs {
  daysWorked: number;
  totalRevenue: number;
  avgDailyRevenue: number;
  totalExpenses: number;
  totalCashDifference: number;
  avgCashDifference: number;
  negativeDays: number;
  positiveDays: number;
  daysIncomplete: number;
  completionRate: number;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
}

export interface TopProduct {
  name: string;
  qtySold: number;
  revenue: number;
}

export interface DailyRevenueData {
  date: string;
  revenue: number;
}

export interface MonthlyData {
  kpis: MonthlyKPIs;
  expensesByCategory: ExpenseByCategory[];
  topProducts: TopProduct[];
  dailyRevenue: DailyRevenueData[];
  dailySheets: DailySheet[];
  previousMonthKPIs?: MonthlyKPIs;
}

// ============================================
// ANNUAL CLOSURE TYPES
// ============================================
export interface AnnualKPIs {
  totalRevenue: number;
  avgMonthlyRevenue: number;
  bestMonth: { month: number; monthName: string; revenue: number } | null;
  worstMonth: { month: number; monthName: string; revenue: number } | null;
  totalExpenses: number;
  avgMonthlyExpenses: number;
  expensesRatio: number; // (expenses / revenue) * 100
  totalCashDifference: number;
  avgMonthlyCashDifference: number;
  negativeMonths: number;
  positiveMonths: number;
  grossMargin: number; // revenue - expenses
  marginRate: number; // (margin / revenue) * 100
  totalDaysWorked: number;
  completionRate: number; // % of days closed vs total days in year
  monthsWithData: number;
}

export interface MonthlyAnnualData {
  month: number;
  monthName: string;
  revenue: number;
  expenses: number;
  margin: number;
  cashDifference: number;
  daysWorked: number;
}

export interface AnnualData {
  kpis: AnnualKPIs;
  monthlyData: MonthlyAnnualData[];
  expensesByCategory: ExpenseByCategory[];
  topProducts: TopProduct[];
  previousYearKPIs?: AnnualKPIs;
}

// ============================================
// CREDIT MANAGEMENT TYPES
// ============================================

export interface CreditCustomer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  creditLimit: number; // 0 = illimité
  currentBalance: number; // Solde actuel dû
  totalCredited: number; // Total crédité historique
  totalPaid: number; // Total réglé historique
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  organizationId: string;
  customerId: string;
  dailySheetId?: string;
  transactionType: 'consumption' | 'payment';
  amount: number; // Toujours positif
  paymentMethod?: 'cash' | 'mobile_money' | 'transfer';
  notes?: string;
  transactionDate: string; // DATE format
  createdAt: string;
  createdBy?: string;
  // Jointures optionnelles
  customer?: CreditCustomer;
  items?: CreditTransactionItem[];
}

export interface CreditTransactionItem {
  id: string;
  transactionId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export interface AddCreditCustomerData {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
}

export interface AddConsumptionData {
  customerId: string;
  transactionDate: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

export interface AddPaymentData {
  customerId: string;
  amount: number;
  paymentMethod: 'cash' | 'mobile_money' | 'transfer';
  notes?: string;
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  transfer: 'Virement',
} as const;

