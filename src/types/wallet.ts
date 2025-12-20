/**
 * RAVITO Wallet System Types
 * Phase 1 MVP - Simulated Banking Integration
 */

// =============================================
// WALLET TYPES
// =============================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// TRANSACTION TYPES
// =============================================

export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  commission?: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, any>;
  relatedOrderId?: string;
  relatedWithdrawalId?: string;
  paymentMethod?: string;
  transactionReference?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// =============================================
// WITHDRAWAL REQUEST TYPES
// =============================================

export type WithdrawalMethod = 
  | 'mobile_money' 
  | 'bank_transfer' 
  | 'orange' 
  | 'mtn' 
  | 'moov' 
  | 'wave';

export type WithdrawalStatus = 
  | 'pending' 
  | 'approved' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: WithdrawalMethod;
  accountDetails: WithdrawalAccountDetails;
  status: WithdrawalStatus;
  requestDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  processedDate?: Date;
  processedBy?: string;
  completedDate?: Date;
  estimatedDate: Date;
  cancellationReason?: string;
  failureReason?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalAccountDetails {
  accountName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  bankName?: string;
  operator?: 'orange' | 'mtn' | 'moov' | 'wave';
}

// =============================================
// WALLET OPERATION TYPES
// =============================================

export interface DepositRequest {
  userId: string;
  amount: number;
  paymentMethod: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WithdrawalRequestInput {
  userId: string;
  amount: number;
  method: WithdrawalMethod;
  accountDetails: WithdrawalAccountDetails;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  orderId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface EarningRequest {
  userId: string;
  amount: number;
  orderId: string;
  commission: number;
  description: string;
}

// =============================================
// WALLET STATISTICS & ANALYTICS
// =============================================

export interface WalletStats {
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPayments: number;
  totalEarnings: number;
  transactionCount: number;
  pendingWithdrawals: number;
  last7DaysActivity: DailyActivity[];
}

export interface DailyActivity {
  date: string;
  deposits: number;
  withdrawals: number;
  payments: number;
  earnings: number;
  balance: number;
}

// =============================================
// COMMISSION SETTINGS
// =============================================

export interface CommissionSettings {
  depositCommission: number; // Percentage
  withdrawalCommission: number; // Percentage
  paymentCommission: number; // Percentage
  minimumWithdrawalFee: number; // Fixed amount
}

// =============================================
// WALLET FILTERS & PAGINATION
// =============================================

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  method?: WithdrawalMethod;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// =============================================
// WALLET OPERATION RESULTS
// =============================================

export interface WalletOperationResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
  errorCode?: string;
}

export interface WithdrawalRequestResult {
  success: boolean;
  requestId?: string;
  estimatedDate?: Date;
  fee?: number;
  netAmount?: number;
  error?: string;
  errorCode?: string;
}

// =============================================
// CONSTANTS
// =============================================

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
  payment: 'Paiement',
  earning: 'Revenu',
  refund: 'Remboursement'
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'En attente',
  completed: 'Complété',
  failed: 'Échoué',
  cancelled: 'Annulé'
};

export const WITHDRAWAL_METHOD_LABELS: Record<WithdrawalMethod, string> = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement Bancaire',
  orange: 'Orange Money',
  mtn: 'MTN Mobile Money',
  moov: 'Moov Money',
  wave: 'Wave'
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  processing: 'En cours',
  completed: 'Complété',
  failed: 'Échoué',
  cancelled: 'Annulé'
};

// Default commission settings (Phase 1 - simulated)
export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  depositCommission: 0, // No fee for deposits in MVP
  withdrawalCommission: 2, // 2% withdrawal fee
  paymentCommission: 0, // No additional fee for payments (commission already in order)
  minimumWithdrawalFee: 100 // 100 XOF minimum
};

// Validation constants
export const WALLET_LIMITS = {
  MIN_DEPOSIT: 1000, // 1000 XOF minimum deposit
  MAX_DEPOSIT: 10000000, // 10 million XOF maximum deposit
  MIN_WITHDRAWAL: 1000, // 1000 XOF minimum withdrawal
  MAX_WITHDRAWAL: 5000000, // 5 million XOF maximum withdrawal
  MIN_BALANCE_AFTER_WITHDRAWAL: 0, // Can withdraw entire balance
  MAX_DAILY_TRANSACTIONS: 50
};
