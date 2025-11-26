/**
 * Treasury Types for DISTRI-NIGHT Platform
 * 
 * These types define the data structures for the client and supplier 
 * treasury (wallet) functionality including transactions, balances,
 * and withdrawal requests.
 */

/**
 * Transaction type enum
 */
export type TransactionType = 'credit' | 'debit' | 'withdrawal' | 'commission';

/**
 * Transaction status enum
 */
export type TransactionStatus = 'pending' | 'completed' | 'failed';

/**
 * Withdrawal request status enum
 */
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

/**
 * Transaction record interface
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
  status: TransactionStatus;
  reference?: string;
}

/**
 * Wallet balance interface
 */
export interface WalletBalance {
  available: number;
  pending: number;
  total_earned?: number; // For suppliers only
}

/**
 * Withdrawal request interface for suppliers
 */
export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at?: string;
  iban_last4: string;
}

/**
 * Recharge options for clients
 */
export interface RechargeOption {
  id: string;
  amount: number;
  label: string;
  isPopular?: boolean;
}

/**
 * Default recharge amounts for clients
 */
export const DEFAULT_RECHARGE_AMOUNTS: RechargeOption[] = [
  { id: 'r50', amount: 50000, label: '50 000 FCFA' },
  { id: 'r100', amount: 100000, label: '100 000 FCFA', isPopular: true },
  { id: 'r200', amount: 200000, label: '200 000 FCFA' },
  { id: 'r500', amount: 500000, label: '500 000 FCFA' },
];

/**
 * Minimum withdrawal amount for suppliers (in FCFA)
 */
export const MINIMUM_WITHDRAWAL_AMOUNT = 50000;

/**
 * Minimum recharge amount for clients (in FCFA)
 */
export const MINIMUM_RECHARGE_AMOUNT = 10000;

/**
 * Maximum recharge amount for clients (in FCFA)
 */
export const MAXIMUM_RECHARGE_AMOUNT = 5000000;

/**
 * Treasury statistics interface
 */
export interface TreasuryStats {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  averageTransactionAmount: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Transaction filter options
 */
export interface TransactionFilterOptions {
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Monthly revenue data for suppliers
 */
export interface MonthlyRevenue {
  month: number;
  year: number;
  monthName: string;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  orderCount: number;
}

/**
 * Bank account information for suppliers
 */
export interface BankAccountInfo {
  id: string;
  accountName: string;
  iban: string;
  ibanLast4: string;
  bankName: string;
  isDefault: boolean;
  createdAt: string;
}
