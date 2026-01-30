import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getSalesRepByUserId,
  getCommercialActivityStats,
  getRegisteredClients,
  calculateCommissionEstimation,
  getPaymentHistory as getPaymentHistoryService
} from '../services/commercialActivityService';
import { getCommissionSettings } from '../services/salesCommissionService';
import { generateRecommendations } from '../services/recommendationService';
import type {
  CommercialActivityStats,
  RegisteredClient,
  CommissionEstimation,
  Recommendation,
  Period,
  SalesCommissionSettings
} from '../types/sales';
import { getCurrentPeriod } from '../types/sales';

interface UseCommercialActivityReturn {
  // Sales rep info
  salesRep: any | null;
  isAuthorized: boolean;
  
  // Stats
  stats: CommercialActivityStats | null;
  registeredClients: RegisteredClient[];
  commissionEstimation: CommissionEstimation | null;
  paymentHistory: any[];
  recommendations: Recommendation[];
  settings: SalesCommissionSettings | null;
  
  // Period
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
  currentPeriod: Period;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshActivity: () => Promise<void>;
}

export const useCommercialActivity = (): UseCommercialActivityReturn => {
  const { user } = useAuth();
  const [salesRep, setSalesRep] = useState<any | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<CommercialActivityStats | null>(null);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [commissionEstimation, setCommissionEstimation] = useState<CommissionEstimation | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [settings, setSettings] = useState<SalesCommissionSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(getCurrentPeriod());
  const currentPeriod = getCurrentPeriod();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is an authorized sales rep
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user) {
        setIsAuthorized(false);
        setSalesRep(null);
        setIsLoading(false);
        return;
      }

      try {
        const rep = await getSalesRepByUserId(user.id);
        if (rep) {
          setSalesRep(rep);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setSalesRep(null);
        }
      } catch (err) {
        console.error('Error checking authorization:', err);
        setIsAuthorized(false);
        setSalesRep(null);
        setError('Erreur lors de la vérification de l\'autorisation');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [user]);

  // Load activity data
  const refreshActivity = useCallback(async () => {
    if (!salesRep || !isAuthorized) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load settings first
      const commissionSettings = await getCommissionSettings();
      setSettings(commissionSettings);

      // Load stats
      const activityStats = await getCommercialActivityStats(salesRep.id, selectedPeriod);
      setStats(activityStats);

      // Load registered clients
      const clients = await getRegisteredClients(salesRep.id);
      setRegisteredClients(clients);

      // Calculate commission estimation
      const estimation = await calculateCommissionEstimation(salesRep.id, selectedPeriod);
      setCommissionEstimation(estimation);

      // Load payment history
      const history = await getPaymentHistoryService(salesRep.id);
      setPaymentHistory(history);

      // Generate recommendations
      if (commissionSettings && activityStats) {
        const recs = generateRecommendations(activityStats, commissionSettings);
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('Error loading commercial activity:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [salesRep, isAuthorized, selectedPeriod]);

  // Refresh when sales rep or period changes
  useEffect(() => {
    if (salesRep && isAuthorized) {
      refreshActivity();
    }
    // refreshActivity is intentionally not in the dependency array to avoid infinite loops
    // It's explicitly called when the conditions are met
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesRep, isAuthorized, selectedPeriod]);

  return {
    salesRep,
    isAuthorized,
    stats,
    registeredClients,
    commissionEstimation,
    paymentHistory,
    recommendations,
    settings,
    selectedPeriod,
    setSelectedPeriod,
    currentPeriod,
    isLoading,
    error,
    refreshActivity
  };
};
