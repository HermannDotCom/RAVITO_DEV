import { useState, useEffect } from 'react';
import { getActiveSalesRepresentatives, SalesRepresentative } from '../services/salesRepresentativeService';

/**
 * Hook pour récupérer la liste des commerciaux actifs
 * Utilisé principalement dans le formulaire d'inscription
 */
export function useSalesRepresentatives() {
  const [salesReps, setSalesReps] = useState<SalesRepresentative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesReps();
  }, []);

  const loadSalesReps = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getActiveSalesRepresentatives();
      setSalesReps(data);
    } catch (err) {
      console.error('Error loading sales representatives:', err);
      setError('Erreur lors du chargement des commerciaux');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    loadSalesReps();
  };

  return {
    salesReps,
    isLoading,
    error,
    refresh
  };
}
