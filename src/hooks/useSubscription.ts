import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from './useOrganization';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionInvoice,
  CreateSubscriptionData
} from '../types/subscription';
import * as subscriptionService from '../services/ravitoGestionSubscriptionService';

interface UseSubscriptionReturn {
  // Data
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  invoices: SubscriptionInvoice[];

  // Status
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  isPendingPayment: boolean;
  isSuspended: boolean;
  canAccessGestionActivity: boolean;
  daysLeftInTrial: number | null;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  createSubscription: (planId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les abonnements Ravito Gestion
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer le nombre de jours restants dans l'essai gratuit
  const daysLeftInTrial = subscription?.status === 'trial' && subscription.trialEndDate
    ? Math.ceil((subscription.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Status dérivés
  const hasActiveSubscription = subscription?.status === 'active';
  const isInTrial = subscription?.status === 'trial';
  const isPendingPayment = subscription?.status === 'pending_payment';
  const isSuspended = subscription?.status === 'suspended';
  const canAccessGestionActivity = isInTrial || hasActiveSubscription;

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      console.log('[useSubscription] Starting to load data, organization:', organization?.id);
      setLoading(true);
      setError(null);

      // TOUJOURS charger les plans (ils sont publics)
      console.log('[useSubscription] Loading plans...');
      const plansData = await subscriptionService.getSubscriptionPlans();
      console.log('[useSubscription] Plans loaded:', plansData.length);
      setPlans(plansData);

      // Charger l'abonnement et les factures SEULEMENT si on a une organisation
      if (organization?.id) {
        console.log('[useSubscription] Loading subscription for org:', organization.id);
        const subscriptionData = await subscriptionService.getOrganizationSubscription(organization.id);
        console.log('[useSubscription] Subscription loaded:', subscriptionData?.id);
        setSubscription(subscriptionData);

        // Charger les factures si l'abonnement existe
        if (subscriptionData) {
          console.log('[useSubscription] Loading invoices...');
          const invoicesData = await subscriptionService.getSubscriptionInvoices(subscriptionData.id);
          console.log('[useSubscription] Invoices loaded:', invoicesData.length);
          setInvoices(invoicesData);
        }
      } else {
        console.log('[useSubscription] No organization yet, skipping subscription load');
      }
    } catch (err) {
      console.error('[useSubscription] Error loading subscription data:', err);
      setError('Erreur lors du chargement des données d\'abonnement');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  // Charger au montage et quand l'organisation change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Créer un nouvel abonnement
  const createSubscription = useCallback(
    async (planId: string): Promise<boolean> => {
      if (!user?.id || !organization?.id) {
        setError('Utilisateur ou organisation non trouvé');
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const data: CreateSubscriptionData = {
          organizationId: organization.id,
          planId
        };

        const newSubscription = await subscriptionService.createSubscription(data);
        setSubscription(newSubscription);

        // Recharger les données
        await loadData();

        return true;
      } catch (err) {
        console.error('Error creating subscription:', err);
        setError('Erreur lors de la création de l\'abonnement');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, organization?.id, loadData]
  );

  // Rafraîchir les données
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    // Data
    subscription,
    plans,
    invoices,

    // Status
    hasActiveSubscription,
    isInTrial,
    isPendingPayment,
    isSuspended,
    canAccessGestionActivity,
    daysLeftInTrial,

    // State
    loading,
    error,

    // Actions
    createSubscription,
    refresh
  };
};
