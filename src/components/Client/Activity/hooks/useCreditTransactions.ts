import { useState, useCallback } from 'react';
import { CreditTransaction, AddConsumptionData, AddPaymentData } from '../../../../types/activity';
import { addConsumption, addPayment } from '../../../../services/creditService';

interface UseCreditTransactionsProps {
  organizationId: string;
  dailySheetId?: string;
  userId: string;
}

export function useCreditTransactions({
  organizationId,
  dailySheetId,
  userId,
}: UseCreditTransactionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddConsumption = useCallback(
    async (consumptionData: AddConsumptionData): Promise<CreditTransaction | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await addConsumption(
          organizationId,
          dailySheetId,
          userId,
          consumptionData
        );

        if (result.error) {
          setError(result.error);
          return null;
        }

        return result.data;
      } catch (err) {
        console.error('Error adding consumption:', err);
        setError('Failed to add consumption');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [organizationId, dailySheetId, userId]
  );

  const handleAddPayment = useCallback(
    async (paymentData: AddPaymentData): Promise<CreditTransaction | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await addPayment(
          organizationId,
          dailySheetId,
          userId,
          paymentData
        );

        if (result.error) {
          setError(result.error);
          return null;
        }

        return result.data;
      } catch (err) {
        console.error('Error adding payment:', err);
        setError('Failed to add payment');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [organizationId, dailySheetId, userId]
  );

  return {
    loading,
    error,
    addConsumption: handleAddConsumption,
    addPayment: handleAddPayment,
  };
}
