export { BalanceCard } from './BalanceCard';
export { TransactionFilters } from './TransactionFilters';
export { TransactionList } from './TransactionList';
export { BalanceChart } from './BalanceChart';
export { RevenueChart } from './RevenueChart';
export { RechargeModal } from './RechargeModal';
export { WithdrawModal } from './WithdrawModal';
export { ExportButton } from './ExportButton';

// Types
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'recharge' | 'purchase' | 'refund' | 'sale' | 'commission' | 'withdrawal' | 'bonus';
  status: 'completed' | 'pending' | 'failed';
  order_id?: string;
  commission?: number;
  net_amount?: number;
}

export interface BalanceStats {
  current: number;
  pending: number;
  total_earned: number;
  month_earned: number;
  variation_percent: number;
}
