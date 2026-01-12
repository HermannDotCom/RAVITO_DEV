import { useState, useEffect, useCallback } from 'react';
import { CrateTypeConfig } from '../types/crateTypes';
import { getCrateTypes, updateCrateTypeConsignable } from '../services/crateTypeService';

export const useCrateTypes = () => {
  const [crateTypes, setCrateTypes] = useState<CrateTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrateTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCrateTypes();
      setCrateTypes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrateTypes();
  }, [fetchCrateTypes]);

  const consignableTypes = crateTypes.filter(ct => ct.isConsignable && ct.isActive);

  const createEmptyCrateSummary = useCallback(() => {
    const summary: Record<string, number> = {};
    consignableTypes.forEach(ct => {
      summary[ct.code] = 0;
    });
    return summary;
  }, [consignableTypes]);

  const toggleConsignable = async (id: string, isConsignable: boolean) => {
    const result = await updateCrateTypeConsignable(id, isConsignable);
    if (result.success) {
      await fetchCrateTypes(); // Refresh
    }
    return result;
  };

  const getCrateLabel = (code: string): string => {
    const crateType = crateTypes.find(ct => ct.code === code);
    return crateType?.label || code;
  };

  const getCrateShortLabel = (code: string): string => {
    const crateType = crateTypes.find(ct => ct.code === code);
    return crateType?.shortLabel || code;
  };

  const isConsignable = (code: string): boolean => {
    const crateType = crateTypes.find(ct => ct.code === code);
    return crateType?.isConsignable || false;
  };

  return {
    crateTypes,
    consignableTypes,
    loading,
    error,
    fetchCrateTypes,
    toggleConsignable,
    createEmptyCrateSummary,
    getCrateLabel,
    getCrateShortLabel,
    isConsignable,
  };
};
