/**
 * RAVITO Wallet Context
 * Global state management for wallet operations
 * Phase 1 MVP - Simulated Banking Integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  Wallet,
  Transaction,
  WithdrawalRequest,
  WalletStats
} from '../types/wallet';
import {
  getOrCreateWallet,
  getWalletBalance,
  createDepositTransaction,
  createPaymentTransaction,
  createEarningTransaction,
  getTransactionHistory,
  createWithdrawalRequest as createWithdrawalRequestService,
  getWithdrawalRequests as getWithdrawalRequestsService,
  calculateWithdrawalFee,
  getWalletStats as getWalletStatsService
} from '../services/walletService';
import { supabase } from '../lib/supabase';

interface WalletContextType {
  wallet: Wallet | null;
  balance: number;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  stats: WalletStats | null;
  isLoading: boolean;
  deposit: (amount: number, paymentMethod: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  payment: (amount: number, orderId: string, description: string) => Promise<{ success: boolean; error?: string }>;
  earning: (amount: number, orderId: string, commission: number, description: string) => Promise<{ success: boolean; error?: string }>;
  requestWithdrawal: (amount: number, method: string, accountDetails: any) => Promise<{ success: boolean; fee?: number; error?: string }>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshWithdrawalRequests: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet data when user changes
  useEffect(() => {
    if (user) {
      loadWalletData();
    } else {
      // Reset state when user logs out
      setWallet(null);
      setBalance(0);
      setTransactions([]);
      setWithdrawalRequests([]);
      setStats(null);
    }
  }, [user]);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to wallet changes
    const walletSubscription = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Wallet updated:', payload);
          refreshWallet();
        }
      )
      .subscribe();

    // Subscribe to transaction changes
    const transactionSubscription = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transaction updated:', payload);
          refreshTransactions();
          refreshWallet(); // Also refresh wallet balance
        }
      )
      .subscribe();

    // Subscribe to withdrawal request changes
    const withdrawalSubscription = supabase
      .channel('withdrawal-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Withdrawal request updated:', payload);
          refreshWithdrawalRequests();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      walletSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
      withdrawalSubscription.unsubscribe();
    };
  }, [user]);

  /**
   * Load all wallet data
   */
  const loadWalletData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await Promise.all([
        refreshWallet(),
        refreshTransactions(),
        refreshWithdrawalRequests(),
        refreshStats()
      ]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh wallet information
   */
  const refreshWallet = async () => {
    if (!user) return;

    try {
      const walletData = await getOrCreateWallet(user.id);
      if (walletData) {
        setWallet(walletData);
        setBalance(walletData.balance);
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    }
  };

  /**
   * Refresh transaction history
   */
  const refreshTransactions = async () => {
    if (!user) return;

    try {
      const txHistory = await getTransactionHistory(user.id, 100);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  /**
   * Refresh withdrawal requests
   */
  const refreshWithdrawalRequests = async () => {
    if (!user) return;

    try {
      const requests = await getWithdrawalRequestsService(user.id);
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error refreshing withdrawal requests:', error);
    }
  };

  /**
   * Refresh wallet statistics
   */
  const refreshStats = async () => {
    if (!user) return;

    try {
      const walletStats = await getWalletStatsService(user.id);
      setStats(walletStats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  /**
   * Make a deposit to wallet
   */
  const deposit = async (
    amount: number,
    paymentMethod: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const result = await createDepositTransaction(user.id, amount, paymentMethod, description);
      
      if (result.success) {
        // Refresh wallet data
        await Promise.all([
          refreshWallet(),
          refreshTransactions(),
          refreshStats()
        ]);
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error in deposit:', error);
      return { success: false, error: 'Erreur lors du dépôt' };
    }
  };

  /**
   * Make a payment from wallet
   */
  const payment = async (
    amount: number,
    orderId: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const result = await createPaymentTransaction(user.id, amount, orderId, description);
      
      if (result.success) {
        // Refresh wallet data
        await Promise.all([
          refreshWallet(),
          refreshTransactions(),
          refreshStats()
        ]);
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error in payment:', error);
      return { success: false, error: 'Erreur lors du paiement' };
    }
  };

  /**
   * Record an earning (for suppliers)
   */
  const earning = async (
    amount: number,
    orderId: string,
    commission: number,
    description: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const result = await createEarningTransaction(user.id, amount, orderId, commission, description);
      
      if (result.success) {
        // Refresh wallet data
        await Promise.all([
          refreshWallet(),
          refreshTransactions(),
          refreshStats()
        ]);
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error in earning:', error);
      return { success: false, error: 'Erreur lors de l\'enregistrement du revenu' };
    }
  };

  /**
   * Request a withdrawal
   */
  const requestWithdrawal = async (
    amount: number,
    method: string,
    accountDetails: any
  ): Promise<{ success: boolean; fee?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const result = await createWithdrawalRequestService(user.id, amount, method, accountDetails);
      
      if (result.success) {
        // Refresh withdrawal requests
        await refreshWithdrawalRequests();
      }

      return {
        success: result.success,
        fee: result.fee,
        error: result.error
      };
    } catch (error) {
      console.error('Error in requestWithdrawal:', error);
      return { success: false, error: 'Erreur lors de la demande de retrait' };
    }
  };

  const value: WalletContextType = {
    wallet,
    balance,
    transactions,
    withdrawalRequests,
    stats,
    isLoading,
    deposit,
    payment,
    earning,
    requestWithdrawal,
    refreshWallet,
    refreshTransactions,
    refreshWithdrawalRequests,
    refreshStats
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
