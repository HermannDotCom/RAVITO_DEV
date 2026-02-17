import React from 'react';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { Paywall } from './Paywall';
import { Clock } from 'lucide-react';
import { formatCurrency } from '../../types/subscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  onSectionChange?: (section: string) => void;
}

/**
 * Composant de protection qui vérifie l'abonnement avant d'afficher le contenu
 * Si l'utilisateur n'a pas d'abonnement actif, affiche le Paywall
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature = 'Gestion Activité',
  onSectionChange
}) => {
  const {
    subscription,
    plans,
    loading,
    canAccessGestionActivity,
    daysLeftInTrial,
    isInTrial
  } = useSubscriptionContext();

  const handleSelectPlan = (planId: string) => {
    if (onSectionChange) {
      onSectionChange('ravito-gestion-subscription');
    }
  };

  // Pendant le chargement, afficher un skeleton neutre sans jamais montrer le Paywall
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
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
              onClick={() => onSectionChange && onSectionChange('ravito-gestion-subscription')}
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
export const SuspendedAccountMessage: React.FC<{ onSectionChange?: (section: string) => void }> = ({ onSectionChange }) => {
  const { subscription } = useSubscriptionContext();

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
          onClick={() => onSectionChange && onSectionChange('support')}
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
export const PendingPaymentMessage: React.FC<{ invoiceAmount?: number; onSectionChange?: (section: string) => void }> = ({ invoiceAmount, onSectionChange }) => {
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
          onClick={() => onSectionChange && onSectionChange('support')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold"
        >
          Contacter le support
        </button>
      </div>
    </div>
  );
};
