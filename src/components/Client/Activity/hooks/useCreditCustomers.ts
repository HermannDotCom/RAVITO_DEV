import { useState, useEffect, useCallback } from 'react';
import { CreditCustomer, AddCreditCustomerData } from '../../../../types/activity';
import {
  getCreditCustomers,
  addCreditCustomer,
  updateCreditCustomer,
  getCreditStatistics,
} from '../../../../services/creditService';

interface UseCreditCustomersProps {
  organizationId: string;
}

export function useCreditCustomers({ organizationId }: UseCreditCustomersProps) {
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    totalCredit: number;
    customersWithBalance: number;
  }>({ totalCredit: 0, customersWithBalance: 0 });

  const loadCustomers = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const [customersResult, statsResult] = await Promise.all([
        getCreditCustomers(organizationId),
        getCreditStatistics(organizationId),
      ]);

      if (customersResult.error) {
        setError(customersResult.error);
      } else {
        setCustomers(customersResult.data || []);
      }

      if (statsResult.data) {
        setStatistics(statsResult.data);
      }
    } catch (err) {
      console.error('Error loading credit customers:', err);
      setError('Failed to load credit customers');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleAddCustomer = async (
    customerData: AddCreditCustomerData
  ): Promise<boolean> => {
    const result = await addCreditCustomer(organizationId, customerData);
    if (result.error) {
      setError(result.error);
      return false;
    }
    await loadCustomers();
    return true;
  };

  const handleUpdateCustomer = async (
    customerId: string,
    updates: Partial<AddCreditCustomerData>
  ): Promise<boolean> => {
    const result = await updateCreditCustomer(customerId, updates);
    if (result.error) {
      setError(result.error);
      return false;
    }
    await loadCustomers();
    return true;
  };

  return {
    customers,
    statistics,
    loading,
    error,
    reload: loadCustomers,
    addCustomer: handleAddCustomer,
    updateCustomer: handleUpdateCustomer,
  };
}
