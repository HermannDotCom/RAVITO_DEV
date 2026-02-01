import { useState, useEffect, useCallback } from 'react';
import type {
  SalesRepresentative,
  SalesObjective,
  SalesCommissionSettings,
  SalesCommissionPayment,
  SalesRepWithMetrics,
  DashboardKPIs,
  Period,
  PeriodCommissionCalculation,
  PaymentHistorySummary
} from '../types/sales';
import * as salesService from '../services/salesCommissionService';
import { useAuth } from '../context/AuthContext';
import { getCurrentPeriod } from '../types/sales';

interface UseSalesCommissionsReturn {
  // Data
  salesReps: SalesRepresentative[];
  objectives: SalesObjective[];
  settings: SalesCommissionSettings | null;
  payments: SalesCommissionPayment[];
  dashboardKPIs: DashboardKPIs | null;
  repsWithMetrics: SalesRepWithMetrics[];
  commissionCalculation: PeriodCommissionCalculation | null;
  paymentHistory: PaymentHistorySummary[];
  
  // Period management
  currentPeriod: Period;
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions - Objectives
  createOrUpdateObjective: (objective: Omit<SalesObjective, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  
  // Actions - Settings
  updateSettings: (settings: Partial<SalesCommissionSettings>) => Promise<boolean>;
  
  // Actions - Payments
  calculateCommissionsForPeriod: (period: Period) => Promise<boolean>;
  saveCommissions: (period: Period) => Promise<boolean>;
  validatePayments: (period: Period) => Promise<boolean>;
  markAsPaid: (period: Period) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshObjectives: () => Promise<void>;
  refreshPayments: () => Promise<void>;
}

/**
 * Custom hook for managing sales commissions
 */
export const useSalesCommissions = (): UseSalesCommissionsReturn => {
  const { user } = useAuth();
  const [salesReps, setSalesReps] = useState<SalesRepresentative[]>([]);
  const [objectives, setObjectives] = useState<SalesObjective[]>([]);
  const [settings, setSettings] = useState<SalesCommissionSettings | null>(null);
  const [payments, setPayments] = useState<SalesCommissionPayment[]>([]);
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null);
  const [repsWithMetrics, setRepsWithMetrics] = useState<SalesRepWithMetrics[]>([]);
  const [commissionCalculation, setCommissionCalculation] = useState<PeriodCommissionCalculation | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistorySummary[]>([]);
  const [currentPeriod] = useState<Period>(getCurrentPeriod());
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(getCurrentPeriod());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sales representatives
  const loadSalesReps = useCallback(async () => {
    try {
      const reps = await salesService.getActiveSalesRepresentatives();
      setSalesReps(reps);
    } catch (err) {
      console.error('Error loading sales reps:', err);
      throw err;
    }
  }, []);

  // Load objectives for selected period
  const loadObjectives = useCallback(async () => {
    try {
      console.log('[useSalesCommissions] Loading objectives for period:', selectedPeriod);
      const objs = await salesService.getObjectivesByPeriod(selectedPeriod);
      console.log('[useSalesCommissions] Loaded objectives:', objs);
      setObjectives(objs);
    } catch (err) {
      console.error('Error loading objectives:', err);
      throw err;
    }
  }, [selectedPeriod]);

  // Load commission settings
  const loadSettings = useCallback(async () => {
    try {
      const s = await salesService.getCommissionSettings();
      setSettings(s);
    } catch (err) {
      console.error('Error loading settings:', err);
      throw err;
    }
  }, []);

  // Load payments for selected period
  const loadPayments = useCallback(async () => {
    try {
      const p = await salesService.getPaymentsByPeriod(selectedPeriod);
      setPayments(p);
    } catch (err) {
      console.error('Error loading payments:', err);
      throw err;
    }
  }, [selectedPeriod]);

  // Load dashboard KPIs
  const loadDashboardKPIs = useCallback(async () => {
    try {
      const kpis = await salesService.getDashboardKPIs(selectedPeriod);
      setDashboardKPIs(kpis);
    } catch (err) {
      console.error('Error loading dashboard KPIs:', err);
      throw err;
    }
  }, [selectedPeriod]);

  // Load sales reps with metrics
  const loadRepsWithMetrics = useCallback(async () => {
    try {
      console.log('[useSalesCommissions] Loading reps with metrics for period:', selectedPeriod);
      const reps = await salesService.getSalesRepsWithMetrics(selectedPeriod);
      console.log('[useSalesCommissions] Loaded reps with metrics:', reps);
      setRepsWithMetrics(reps);
    } catch (err) {
      console.error('Error loading reps with metrics:', err);
      throw err;
    }
  }, [selectedPeriod]);

  // Load payment history
  const loadPaymentHistory = useCallback(async () => {
    try {
      const allPayments = await salesService.getPaymentHistory();
      
      // Group by period and aggregate
      const historyMap = new Map<string, PaymentHistorySummary>();
      
      allPayments.forEach(payment => {
        const key = `${payment.periodYear}-${payment.periodMonth}`;
        const existing = historyMap.get(key);
        
        if (existing) {
          existing.salesRepsCount++;
          existing.totalAmount += payment.totalAmount;
          // Keep the latest paidAt date
          if (payment.paidAt && (!existing.paidAt || payment.paidAt > existing.paidAt)) {
            existing.paidAt = payment.paidAt;
          }
        } else {
          historyMap.set(key, {
            period: { year: payment.periodYear, month: payment.periodMonth },
            salesRepsCount: 1,
            totalAmount: payment.totalAmount,
            status: payment.status,
            paidAt: payment.paidAt
          });
        }
      });
      
      setPaymentHistory(Array.from(historyMap.values()));
    } catch (err) {
      console.error('Error loading payment history:', err);
      throw err;
    }
  }, []);

  // Initial load - CORRIGÉ : ajout de loadRepsWithMetrics
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await Promise.all([
          loadSalesReps(),
          loadObjectives(),
          loadSettings(),
          loadPayments(),
          loadPaymentHistory(),
          loadRepsWithMetrics()  // ✅ AJOUTÉ
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [loadSalesReps, loadObjectives, loadSettings, loadPayments, loadPaymentHistory, loadRepsWithMetrics]); // ✅ AJOUTÉ loadRepsWithMetrics

  // Refresh dashboard when period changes
  const refreshDashboard = useCallback(async () => {
    try {
      await Promise.all([
        loadDashboardKPIs(),
        loadRepsWithMetrics()
      ]);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Erreur lors du rafraîchissement du tableau de bord');
    }
  }, [loadDashboardKPIs, loadRepsWithMetrics]);

  // Refresh objectives
  const refreshObjectives = useCallback(async () => {
    try {
      await Promise.all([
        loadObjectives(),
        loadRepsWithMetrics()  // ✅ AJOUTÉ pour rafraîchir aussi les metrics
      ]);
    } catch (err) {
      console.error('Error refreshing objectives:', err);
      setError('Erreur lors du rafraîchissement des objectifs');
    }
  }, [loadObjectives, loadRepsWithMetrics]);

  // Refresh payments
  const refreshPayments = useCallback(async () => {
    try {
      await Promise.all([
        loadPayments(),
        loadPaymentHistory()
      ]);
    } catch (err) {
      console.error('Error refreshing payments:', err);
      setError('Erreur lors du rafraîchissement des primes');
    }
  }, [loadPayments, loadPaymentHistory]);

  // Full refresh - CORRIGÉ : ajout de loadRepsWithMetrics
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        loadSalesReps(),
        loadObjectives(),
        loadSettings(),
        loadPayments(),
        loadPaymentHistory(),
        loadRepsWithMetrics()  // ✅ AJOUTÉ
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
      setError('Erreur lors du rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  }, [loadSalesReps, loadObjectives, loadSettings, loadPayments, loadPaymentHistory, loadRepsWithMetrics]); // ✅ AJOUTÉ loadRepsWithMetrics

  // Create or update objective
  const createOrUpdateObjective = useCallback(
    async (objective: Omit<SalesObjective, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
      try {
        setError(null);
        await salesService.createOrUpdateObjective(objective);
        await refreshObjectives();
        return true;
      } catch (err) {
        console.error('Error creating/updating objective:', err);
        setError('Erreur lors de la sauvegarde de l\'objectif');
        return false;
      }
    },
    [refreshObjectives]
  );

  // Delete objective
  const deleteObjective = useCallback(
    async (objectiveId: string): Promise<boolean> => {
      try {
        setError(null);
        await salesService.deleteObjective(objectiveId);
        await refreshObjectives();
        return true;
      } catch (err) {
        console.error('Error deleting objective:', err);
        setError('Erreur lors de la suppression de l\'objectif');
        return false;
      }
    },
    [refreshObjectives]
  );

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<SalesCommissionSettings>): Promise<boolean> => {
      if (!user?.id) {
        setError('Utilisateur non authentifié');
        return false;
      }

      try {
        setError(null);
        await salesService.updateCommissionSettings(newSettings, user.id);
        await loadSettings();
        return true;
      } catch (err) {
        console.error('Error updating settings:', err);
        setError('Erreur lors de la sauvegarde des paramètres');
        return false;
      }
    },
    [user?.id, loadSettings]
  );

  // Calculate commissions for a period
  const calculateCommissionsForPeriod = useCallback(
    async (period: Period): Promise<boolean> => {
      try {
        setError(null);
        const calculation = await salesService.calculateCommissions(period);
        setCommissionCalculation(calculation);
        return true;
      } catch (err) {
        console.error('Error calculating commissions:', err);
        setError('Erreur lors du calcul des primes');
        return false;
      }
    },
    []
  );

  // Save commissions to database
  const saveCommissions = useCallback(
    async (period: Period): Promise<boolean> => {
      if (!commissionCalculation) {
        setError('Aucun calcul de primes disponible');
        return false;
      }

      try {
        setError(null);
        
        // Save each commission calculation as a payment
        for (const calc of commissionCalculation.calculations) {
          await salesService.createOrUpdatePayment({
            periodYear: period.year,
            periodMonth: period.month,
            salesRepId: calc.salesRepId,
            chrActivated: calc.chrActivated,
            depotActivated: calc.depotActivated,
            primeInscriptions: calc.primeInscriptions,
            bonusObjectives: calc.bonusObjectives,
            bonusOvershoot: calc.bonusOvershoot,
            bonusSpecial: calc.bonusSpecial,
            commissionCa: calc.commissionCa,
            totalAmount: calc.totalAmount,
            status: 'pending',
            validatedAt: null,
            validatedBy: null,
            paidAt: null,
            paidBy: null
          });
        }
        
        await refreshPayments();
        return true;
      } catch (err) {
        console.error('Error saving commissions:', err);
        setError('Erreur lors de la sauvegarde des primes');
        return false;
      }
    },
    [commissionCalculation, refreshPayments]
  );

  // Validate payments
  const validatePayments = useCallback(
    async (period: Period): Promise<boolean> => {
      if (!user?.id) {
        setError('Utilisateur non authentifié');
        return false;
      }

      try {
        setError(null);
        await salesService.validatePayments(period, user.id);
        await refreshPayments();
        return true;
      } catch (err) {
        console.error('Error validating payments:', err);
        setError('Erreur lors de la validation des primes');
        return false;
      }
    },
    [user?.id, refreshPayments]
  );

  // Mark payments as paid
  const markAsPaid = useCallback(
    async (period: Period): Promise<boolean> => {
      if (!user?.id) {
        setError('Utilisateur non authentifié');
        return false;
      }

      try {
        setError(null);
        await salesService.markPaymentsAsPaid(period, user.id);
        await refreshPayments();
        return true;
      } catch (err) {
        console.error('Error marking payments as paid:', err);
        setError('Erreur lors du marquage des paiements');
        return false;
      }
    },
    [user?.id, refreshPayments]
  );

  return {
    // Data
    salesReps,
    objectives,
    settings,
    payments,
    dashboardKPIs,
    repsWithMetrics,
    commissionCalculation,
    paymentHistory,
    
    // Period
    currentPeriod,
    selectedPeriod,
    setSelectedPeriod,
    
    // State
    isLoading,
    error,
    
    // Actions
    createOrUpdateObjective,
    deleteObjective,
    updateSettings,
    calculateCommissionsForPeriod,
    saveCommissions,
    validatePayments,
    markAsPaid,
    
    // Refresh
    refresh,
    refreshDashboard,
    refreshObjectives,
    refreshPayments
  };
};