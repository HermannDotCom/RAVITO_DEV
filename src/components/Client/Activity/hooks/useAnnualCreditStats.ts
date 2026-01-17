import { useState, useEffect, useCallback } from 'react';
import { AnnualCreditStats } from '../../../../types/activity';
import { getAnnualCreditStats } from '../../../../services/creditService';

interface UseAnnualCreditStatsProps {
  organizationId: string;
  year: number;
}

export function useAnnualCreditStats({
  organizationId,
  year,
}: UseAnnualCreditStatsProps) {
  const [stats, setStats] = useState<AnnualCreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAnnualCreditStats(organizationId, year);

      if (result.error) {
        setError(result.error);
      } else {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error loading annual credit stats:', err);
      setError('Failed to load annual credit statistics');
    } finally {
      setLoading(false);
    }
  }, [organizationId, year]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    reload: loadStats,
  };
}
