import { useState, useEffect, useCallback } from 'react';
import { CreditAlert } from '../../../../types/activity';
import { getCreditAlerts } from '../../../../services/creditService';

interface UseCreditAlertsProps {
  organizationId: string;
}

export function useCreditAlerts({ organizationId }: UseCreditAlertsProps) {
  const [alerts, setAlerts] = useState<CreditAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getCreditAlerts(organizationId);

      if (result.error) {
        setError(result.error);
      } else {
        setAlerts(result.data || []);
      }
    } catch (err) {
      console.error('Error loading credit alerts:', err);
      setError('Failed to load credit alerts');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Compute statistics
  const criticalCount = alerts.filter(a => a.alertLevel === 'critical').length;
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;
  const totalAtRisk = alerts.reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    alerts,
    criticalCount,
    warningCount,
    totalAtRisk,
    loading,
    error,
    reload: loadAlerts,
  };
}
