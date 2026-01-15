import { useState, useEffect, useCallback } from 'react';
import {
  CreditCustomer,
  CreditTransaction,
  CreditTransactionItem,
} from '../../../../types/activity';
import {
  getCreditCustomer,
  getCustomerTransactions,
  getTransactionItems,
} from '../../../../services/creditService';

interface UseCustomerDetailsProps {
  customerId: string | null;
}

export function useCustomerDetails({ customerId }: UseCustomerDetailsProps) {
  const [customer, setCustomer] = useState<CreditCustomer | null>(null);
  const [transactions, setTransactions] = useState<
    (CreditTransaction & { items?: CreditTransactionItem[] })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerDetails = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load customer and transactions in parallel
      const [customerResult, transactionsResult] = await Promise.all([
        getCreditCustomer(customerId),
        getCustomerTransactions(customerId),
      ]);

      if (customerResult.error) {
        setError(customerResult.error);
        return;
      }

      if (transactionsResult.error) {
        setError(transactionsResult.error);
        return;
      }

      setCustomer(customerResult.data);
      
      // Load items for consumption transactions
      const transactionsWithItems = await Promise.all(
        (transactionsResult.data || []).map(async (transaction) => {
          if (transaction.transactionType === 'consumption') {
            const itemsResult = await getTransactionItems(transaction.id);
            return {
              ...transaction,
              items: itemsResult.data || [],
            };
          }
          return transaction;
        })
      );

      setTransactions(transactionsWithItems);
    } catch (err) {
      console.error('Error loading customer details:', err);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomerDetails();
  }, [loadCustomerDetails]);

  return {
    customer,
    transactions,
    loading,
    error,
    reload: loadCustomerDetails,
  };
}
