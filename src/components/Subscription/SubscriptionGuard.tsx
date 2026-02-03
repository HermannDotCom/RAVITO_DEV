import React from 'react';
import { useNavigate } from '../../hooks/useSimpleRouter';
import { useSubscription } from '../../hooks/useSubscription';
import { Paywall } from './Paywall';
import { Clock } from 'lucide-react';
import { formatCurrency } from '../../types/subscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
}

/**
 * Composant de protection qui vérifie l'abonnement avant d'afficher le contenu
 * Si l'utilisateur n'a pas d'abonnement actif, affiche le Paywall
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature = 'Gestion Activité'
}) => {
  const navigate = useNavigate();
  const {
    subscription,
    plans,
    loading,
    canAccessGestionActivity,
    daysLeftInTrial,
    isInTrial
  } = useSubscription();

  const handleSelectPlan = (planId: string) => {
    navigate(`/ravito-gestion-subscription?planId=${planId}`);
  };

  // Affichage du loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas accès, afficher le Paywall
  if (!canAccessGestionActivity) {
    return (
      <Paywall
        plans={plans}
        onSelectPlan={handleSelectPlan}
        loading={loading}
      />
    );
  }

  // Si l'utilisateur est en période d'essai, afficher la bannière
  if (isInTrial && daysLeftInTrial !== null) {
    return (
      <>
        {/* Bannière essai gratuit */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                Période d'essai : {daysLeftInTrial} jour{daysLeftInTrial > 1 ? 's' : ''} restant{daysLeftInTrial > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => navigate('/ravito-gestion-subscription')}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              Voir les offres
            </button>
          </div>
        </div>

        {/* Contenu protégé */}
        {children}
      </>
    );
  }

  // Accès autorisé (abonnement actif)
  return <>{children}</>;
};

/**
 * Variante simplifiée pour les clients avec abonnement suspendu
 */
export const SuspendedAccountMessage: React.FC = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  if (subscription?.status !== 'suspended') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Abonnement suspendu
        </h2>
        <p className="text-gray-600 mb-6">
          Votre abonnement a été suspendu pour non-paiement.
          Contactez notre équipe pour régulariser votre situation.
        </p>
        <button
          onClick={() => navigate('/contact')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold"
        >
          Contacter le support
        </button>
      </div>
    </div>
  );
};

/**
 * Message pour les utilisateurs en attente de paiement
 */
export const PendingPaymentMessage: React.FC<{ invoiceAmount?: number }> = ({ invoiceAmount }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement en attente
        </h2>
        <p className="text-gray-600 mb-4">
          Votre période d'essai gratuit est terminée.
        </p>
        {invoiceAmount && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Montant dû :</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(invoiceAmount)}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-600 mb-6">
          Effectuez votre paiement par Cash, Wave, Orange Money ou MTN Money,
          puis contactez notre équipe pour validation.
        </p>
        <button
          onClick={() => navigate('/contact')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold"
        >
          Contacter le support
        </button>
      </div>
    </div>
  );
};
