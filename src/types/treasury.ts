/**
 * Treasury Types for RAVITO Platform
 */

export type TransactionType = 'credit' | 'debit' | 'withdrawal' | 'commission' | 'recharge';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface RechargeOption {
  id: string;
  amount: number;
  label: string;
  isPopular?: boolean;
}

// Montants prédéfinis pour recharge client (en FCFA)
export const DEFAULT_RECHARGE_AMOUNTS: RechargeOption[] = [
  { id: 'r50', amount: 50000, label: '50 000 FCFA' },
  { id: 'r100', amount: 100000, label: '100 000 FCFA', isPopular: true },
  { id: 'r200', amount: 200000, label: '200 000 FCFA' },
  { id: 'r500', amount: 500000, label: '500 000 FCFA' },
];

// Contraintes
export const MINIMUM_WITHDRAWAL_AMOUNT = 50000; // 50K FCFA minimum pour retrait
export const MINIMUM_RECHARGE_AMOUNT = 10000;   // 10K FCFA minimum pour recharge
export const MAXIMUM_RECHARGE_AMOUNT = 5000000; // 5M FCFA maximum pour recharge
