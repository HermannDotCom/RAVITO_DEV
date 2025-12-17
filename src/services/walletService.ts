/**
 * RAVITO Wallet Service
 * Business logic for wallet operations
 * Phase 1 MVP - Simulated Banking Integration
 */

import { supabase } from '../lib/supabase';
import {
  Wallet,
  Transaction,
  WithdrawalRequest,
  WalletStats,
  DailyActivity,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
  DEFAULT_COMMISSION_SETTINGS,
  WALLET_LIMITS
} from '../types/wallet';

// =============================================
// WALLET MANAGEMENT
// =============================================

/**
 * Get or create wallet for user
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet | null> {
  try {
    // First try to get existing wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingWallet && !fetchError) {
      return mapDatabaseWalletToApp(existingWallet);
    }

    // Create new wallet if doesn't exist
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert([{
        user_id: userId,
        balance: 0,
        currency: 'XOF',
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating wallet:', createError);
      return null;
    }

    return mapDatabaseWalletToApp(newWallet);
  } catch (error) {
    console.error('Exception in getOrCreateWallet:', error);
    return null;
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }

    return parseFloat(data.balance) || 0;
  } catch (error) {
    console.error('Exception in getWalletBalance:', error);
    return 0;
  }
}

// =============================================
// TRANSACTION MANAGEMENT
// =============================================

/**
 * Create a deposit transaction
 */
export async function createDepositTransaction(
  userId: string,
  amount: number,
  paymentMethod: string,
  description?: string
): Promise<{ success: boolean; transactionId?: string; newBalance?: number; error?: string }> {
  try {
    // Validate amount
    if (amount < WALLET_LIMITS.MIN_DEPOSIT) {
      return { success: false, error: `Montant minimum: ${WALLET_LIMITS.MIN_DEPOSIT} XOF` };
    }

    if (amount > WALLET_LIMITS.MAX_DEPOSIT) {
      return { success: false, error: `Montant maximum: ${WALLET_LIMITS.MAX_DEPOSIT} XOF` };
    }

    // Get wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Impossible de récupérer le portefeuille' };
    }

    const currentBalance = wallet.balance;
    const newBalance = currentBalance + amount;

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([{
        wallet_id: wallet.id,
        user_id: userId,
        type: 'deposit',
        amount: amount,
        commission: 0, // No commission on deposits in MVP
        balance_before: currentBalance,
        balance_after: newBalance,
        status: 'completed',
        description: description || `Dépôt via ${paymentMethod}`,
        payment_method: paymentMethod,
        transaction_reference: generateTransactionReference(),
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (txError) {
      console.error('Error creating deposit transaction:', txError);
      return { success: false, error: 'Erreur lors de la création de la transaction' };
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return { success: false, error: 'Erreur lors de la mise à jour du solde' };
    }

    return {
      success: true,
      transactionId: transaction.id,
      newBalance: newBalance
    };
  } catch (error) {
    console.error('Exception in createDepositTransaction:', error);
    return { success: false, error: 'Erreur système' };
  }
}

/**
 * Create a payment transaction (for orders)
 */
export async function createPaymentTransaction(
  userId: string,
  amount: number,
  orderId: string,
  description: string
): Promise<{ success: boolean; transactionId?: string; newBalance?: number; error?: string }> {
  try {
    // Get wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Impossible de récupérer le portefeuille' };
    }

    const currentBalance = wallet.balance;

    // Check sufficient balance
    if (currentBalance < amount) {
      return { success: false, error: 'Solde insuffisant' };
    }

    const newBalance = currentBalance - amount;

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([{
        wallet_id: wallet.id,
        user_id: userId,
        type: 'payment',
        amount: amount,
        commission: 0,
        balance_before: currentBalance,
        balance_after: newBalance,
        status: 'completed',
        description: description,
        related_order_id: orderId,
        transaction_reference: generateTransactionReference(),
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (txError) {
      console.error('Error creating payment transaction:', txError);
      return { success: false, error: 'Erreur lors de la création de la transaction' };
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return { success: false, error: 'Erreur lors de la mise à jour du solde' };
    }

    return {
      success: true,
      transactionId: transaction.id,
      newBalance: newBalance
    };
  } catch (error) {
    console.error('Exception in createPaymentTransaction:', error);
    return { success: false, error: 'Erreur système' };
  }
}

/**
 * Create an earning transaction (for suppliers)
 */
export async function createEarningTransaction(
  userId: string,
  amount: number,
  orderId: string,
  commission: number,
  description: string
): Promise<{ success: boolean; transactionId?: string; newBalance?: number; error?: string }> {
  try {
    // Get wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Impossible de récupérer le portefeuille' };
    }

    const currentBalance = wallet.balance;
    const netAmount = amount - commission; // Deduct platform commission
    const newBalance = currentBalance + netAmount;

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([{
        wallet_id: wallet.id,
        user_id: userId,
        type: 'earning',
        amount: netAmount,
        commission: commission,
        balance_before: currentBalance,
        balance_after: newBalance,
        status: 'completed',
        description: description,
        related_order_id: orderId,
        transaction_reference: generateTransactionReference(),
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (txError) {
      console.error('Error creating earning transaction:', txError);
      return { success: false, error: 'Erreur lors de la création de la transaction' };
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return { success: false, error: 'Erreur lors de la mise à jour du solde' };
    }

    return {
      success: true,
      transactionId: transaction.id,
      newBalance: newBalance
    };
  } catch (error) {
    console.error('Exception in createEarningTransaction:', error);
    return { success: false, error: 'Erreur système' };
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data.map(mapDatabaseTransactionToApp);
  } catch (error) {
    console.error('Exception in getTransactionHistory:', error);
    return [];
  }
}

// =============================================
// WITHDRAWAL MANAGEMENT
// =============================================

/**
 * Calculate withdrawal fee
 */
export function calculateWithdrawalFee(amount: number, method: string): number {
  const feePercentage = DEFAULT_COMMISSION_SETTINGS.withdrawalCommission / 100;
  let fee = Math.round(amount * feePercentage);
  
  // Apply minimum fee
  if (fee < DEFAULT_COMMISSION_SETTINGS.minimumWithdrawalFee) {
    fee = DEFAULT_COMMISSION_SETTINGS.minimumWithdrawalFee;
  }
  
  return fee;
}

/**
 * Create withdrawal request
 */
export async function createWithdrawalRequest(
  userId: string,
  amount: number,
  method: string,
  accountDetails: any
): Promise<{ success: boolean; requestId?: string; fee?: number; netAmount?: number; error?: string }> {
  try {
    // Validate amount
    if (amount < WALLET_LIMITS.MIN_WITHDRAWAL) {
      return { success: false, error: `Montant minimum: ${WALLET_LIMITS.MIN_WITHDRAWAL} XOF` };
    }

    if (amount > WALLET_LIMITS.MAX_WITHDRAWAL) {
      return { success: false, error: `Montant maximum: ${WALLET_LIMITS.MAX_WITHDRAWAL} XOF` };
    }

    // Get wallet and check balance
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Impossible de récupérer le portefeuille' };
    }

    const fee = calculateWithdrawalFee(amount, method);
    const netAmount = amount - fee;

    if (wallet.balance < amount) {
      return { success: false, error: 'Solde insuffisant' };
    }

    // Calculate estimated completion date (24h simulation)
    const estimatedDate = new Date();
    estimatedDate.setHours(estimatedDate.getHours() + 24);

    // Create withdrawal request
    const { data: request, error: requestError } = await supabase
      .from('withdrawal_requests')
      .insert([{
        wallet_id: wallet.id,
        user_id: userId,
        amount: amount,
        fee: fee,
        net_amount: netAmount,
        method: method,
        account_details: accountDetails,
        status: 'pending',
        estimated_date: estimatedDate.toISOString()
      }])
      .select()
      .single();

    if (requestError) {
      console.error('Error creating withdrawal request:', requestError);
      return { success: false, error: 'Erreur lors de la création de la demande' };
    }

    return {
      success: true,
      requestId: request.id,
      fee: fee,
      netAmount: netAmount
    };
  } catch (error) {
    console.error('Exception in createWithdrawalRequest:', error);
    return { success: false, error: 'Erreur système' };
  }
}

/**
 * Get withdrawal requests
 */
export async function getWithdrawalRequests(
  userId: string,
  status?: WithdrawalStatus
): Promise<WithdrawalRequest[]> {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('request_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }

    return data.map(mapDatabaseWithdrawalToApp);
  } catch (error) {
    console.error('Exception in getWithdrawalRequests:', error);
    return [];
  }
}

// =============================================
// STATISTICS & ANALYTICS
// =============================================

/**
 * Get wallet statistics
 */
export async function getWalletStats(userId: string): Promise<WalletStats> {
  try {
    const wallet = await getOrCreateWallet(userId);
    const transactions = await getTransactionHistory(userId, 1000);
    
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPayments = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalEarnings = transactions
      .filter(t => t.type === 'earning' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get pending withdrawal requests
    const pendingRequests = await getWithdrawalRequests(userId, 'pending');

    // Calculate last 7 days activity
    const last7Days = getLast7DaysActivity(transactions, wallet?.balance || 0);

    return {
      totalBalance: wallet?.balance || 0,
      totalDeposits,
      totalWithdrawals,
      totalPayments,
      totalEarnings,
      transactionCount: transactions.length,
      pendingWithdrawals: pendingRequests.length,
      last7DaysActivity: last7Days
    };
  } catch (error) {
    console.error('Exception in getWalletStats:', error);
    return {
      totalBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalPayments: 0,
      totalEarnings: 0,
      transactionCount: 0,
      pendingWithdrawals: 0,
      last7DaysActivity: []
    };
  }
}

/**
 * Get last 7 days activity
 */
function getLast7DaysActivity(transactions: Transaction[], currentBalance: number): DailyActivity[] {
  const days: DailyActivity[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayTransactions = transactions.filter(t => {
      const txDate = new Date(t.createdAt);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === date.getTime() && t.status === 'completed';
    });
    
    days.push({
      date: date.toISOString().split('T')[0],
      deposits: dayTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
      withdrawals: dayTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
      payments: dayTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0),
      earnings: dayTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0),
      balance: i === 0 ? currentBalance : 0 // Only show current balance for today
    });
  }
  
  return days;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Generate unique transaction reference
 */
function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Map database wallet to app format
 */
function mapDatabaseWalletToApp(dbWallet: any): Wallet {
  return {
    id: dbWallet.id,
    userId: dbWallet.user_id,
    balance: parseFloat(dbWallet.balance) || 0,
    currency: dbWallet.currency,
    isActive: dbWallet.is_active,
    createdAt: new Date(dbWallet.created_at),
    updatedAt: new Date(dbWallet.updated_at)
  };
}

/**
 * Map database transaction to app format
 */
function mapDatabaseTransactionToApp(dbTx: any): Transaction {
  return {
    id: dbTx.id,
    walletId: dbTx.wallet_id,
    userId: dbTx.user_id,
    type: dbTx.type as TransactionType,
    amount: parseFloat(dbTx.amount) || 0,
    commission: dbTx.commission ? parseFloat(dbTx.commission) : undefined,
    balanceBefore: parseFloat(dbTx.balance_before) || 0,
    balanceAfter: parseFloat(dbTx.balance_after) || 0,
    status: dbTx.status as TransactionStatus,
    description: dbTx.description || '',
    metadata: dbTx.metadata,
    relatedOrderId: dbTx.related_order_id,
    relatedWithdrawalId: dbTx.related_withdrawal_id,
    paymentMethod: dbTx.payment_method,
    transactionReference: dbTx.transaction_reference,
    createdAt: new Date(dbTx.created_at),
    updatedAt: new Date(dbTx.updated_at),
    completedAt: dbTx.completed_at ? new Date(dbTx.completed_at) : undefined
  };
}

/**
 * Map database withdrawal to app format
 */
function mapDatabaseWithdrawalToApp(dbWithdrawal: any): WithdrawalRequest {
  return {
    id: dbWithdrawal.id,
    walletId: dbWithdrawal.wallet_id,
    userId: dbWithdrawal.user_id,
    amount: parseFloat(dbWithdrawal.amount) || 0,
    fee: parseFloat(dbWithdrawal.fee) || 0,
    netAmount: parseFloat(dbWithdrawal.net_amount) || 0,
    method: dbWithdrawal.method,
    accountDetails: dbWithdrawal.account_details || {},
    status: dbWithdrawal.status as WithdrawalStatus,
    requestDate: new Date(dbWithdrawal.request_date),
    approvedDate: dbWithdrawal.approved_date ? new Date(dbWithdrawal.approved_date) : undefined,
    approvedBy: dbWithdrawal.approved_by,
    processedDate: dbWithdrawal.processed_date ? new Date(dbWithdrawal.processed_date) : undefined,
    processedBy: dbWithdrawal.processed_by,
    completedDate: dbWithdrawal.completed_date ? new Date(dbWithdrawal.completed_date) : undefined,
    estimatedDate: new Date(dbWithdrawal.estimated_date),
    cancellationReason: dbWithdrawal.cancellation_reason,
    failureReason: dbWithdrawal.failure_reason,
    notes: dbWithdrawal.notes,
    metadata: dbWithdrawal.metadata,
    createdAt: new Date(dbWithdrawal.created_at),
    updatedAt: new Date(dbWithdrawal.updated_at)
  };
}
