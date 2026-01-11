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
  establishmentProduct?: EstablishmentProduct;
}

// ============================================
// DAILY PACKAGING
// ============================================
export interface DailyPackaging {
  id: string;
  dailySheetId: string;
  crateType: string; // C12, C24, C12V, C6, C20, etc.
  qtyFullStart: number; // Casiers pleins matin
  qtyEmptyStart: number; // Casiers vides matin
  qtyReceived: number; // Casiers reçus (livraisons RAVITO)
  qtyReturned: number; // Casiers rendus aux fournisseurs
  qtyFullEnd?: number; // Casiers pleins soir (saisie manuelle)
  qtyEmptyEnd?: number; // Casiers vides soir (saisie manuelle)
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
export type ActivityTab = 'stocks' | 'packaging' | 'cash' | 'summary';

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
  qtyFullEnd?: number;
  qtyEmptyEnd?: number;
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
  C12: 'Casier 12 bouteilles',
  C24: 'Casier 24 bouteilles',
  C12V: 'Casier 12 bouteilles (verre)',
  C6: 'Casier 6 bouteilles',
  C20: 'Casier 20 bouteilles',
  CARTON24: 'Carton 24 unités',
  PACK6: 'Pack 6 unités',
  PACK12: 'Pack 12 unités',
} as const;
