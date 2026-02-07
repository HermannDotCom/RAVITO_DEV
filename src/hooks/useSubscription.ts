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
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  invoices: SubscriptionInvoice[];

  hasActiveSubscription: boolean;
  isInTrial: boolean;
  isPendingPayment: boolean;
  isSuspended: boolean;
  canAccessGestionActivity: boolean;
  daysLeftInTrial: number | null;

  loading: boolean;
  error: string | null;

  createSubscription: (planId: string) => Promise<boolean>;
  cancelSubscription: (reason?: string) => Promise<boolean>;
  submitPaymentClaim: (invoiceId: string, paymentMethod: string, transactionReference: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les abonnements Ravito Gestion
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
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
      console.log('[useSubscription] Starting to load data, organization:', organizationId);
      setLoading(true);
      setError(null);

      // TOUJOURS charger les plans (ils sont publics)
      console.log('[useSubscription] Loading plans...');
      const plansData = await subscriptionService.getSubscriptionPlans();
      console.log('[useSubscription] Plans loaded:', plansData.length);
      setPlans(plansData);

      // Charger l'abonnement et les factures SEULEMENT si on a une organisation
      if (organizationId) {
        console.log('[useSubscription] Loading subscription for org:', organizationId);
        const subscriptionData = await subscriptionService.getOrganizationSubscription(organizationId);
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
  }, [organizationId]);

  // Charger au montage et quand l'organisation change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Créer un nouvel abonnement
  const createSubscription = useCallback(
    async (planId: string): Promise<boolean> => {
      if (!user?.id || !organizationId) {
        setError('Utilisateur ou organisation non trouvé');
        return false;
      }

      try {
        setIsCreatingSubscription(true);
        setError(null);

        const data: CreateSubscriptionData = {
          organizationId,
          planId
        };

        console.log('[useSubscription] Creating subscription with data:', data);
        const newSubscription = await subscriptionService.createSubscription(data);
        console.log('[useSubscription] Subscription created:', newSubscription.id);
        setSubscription(newSubscription);

        // Recharger les données
        await loadData();

        return true;
      } catch (err) {
        console.error('Error creating subscription:', err);
        setError('Erreur lors de la création de l\'abonnement');
        return false;
      } finally {
        setIsCreatingSubscription(false);
      }
    },
    [user?.id, organizationId, loadData]
  );

  const cancelSubscription = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!subscription?.id) {
        setError('Aucun abonnement trouvé');
        return false;
      }
      try {
        setError(null);
        await subscriptionService.cancelSubscription(subscription.id, reason);
        await loadData();
        return true;
      } catch (err) {
        console.error('Error cancelling subscription:', err);
        setError('Erreur lors de la résiliation');
        return false;
      }
    },
    [subscription?.id, loadData]
  );

  const submitPaymentClaim = useCallback(
    async (invoiceId: string, paymentMethod: string, transactionReference: string): Promise<boolean> => {
      try {
        setError(null);
        await subscriptionService.submitPaymentClaim(invoiceId, paymentMethod, transactionReference);
        await loadData();
        return true;
      } catch (err) {
        console.error('Error submitting payment claim:', err);
        setError('Erreur lors de la déclaration de paiement');
        return false;
      }
    },
    [loadData]
  );

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    subscription,
    plans,
    invoices,

    hasActiveSubscription,
    isInTrial,
    isPendingPayment,
    isSuspended,
    canAccessGestionActivity,
    daysLeftInTrial,

    loading,
    error,

    createSubscription,
    cancelSubscription,
    submitPaymentClaim,
    refresh
  };
};
