import { useState, useEffect, useCallback } from 'react';
import { MonthlyCreditStats } from '../../../../types/activity';
import { getMonthlyCreditStats } from '../../../../services/creditService';

interface UseMonthlyCreditStatsProps {
  organizationId: string;
  month: number;
  year: number;
}

export function useMonthlyCreditStats({
  organizationId,
  month,
  year,
}: UseMonthlyCreditStatsProps) {
  const [stats, setStats] = useState<MonthlyCreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getMonthlyCreditStats(organizationId, month, year);

      if (result.error) {
        setError(result.error);
      } else {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error loading monthly credit stats:', err);
      setError('Failed to load monthly credit statistics');
    } finally {
      setLoading(false);
    }
  }, [organizationId, month, year]);

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
