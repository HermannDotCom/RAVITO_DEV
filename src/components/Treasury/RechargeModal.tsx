import React, { useState } from 'react';
import { X, CreditCard, Plus, Check } from 'lucide-react';
import { 
  DEFAULT_RECHARGE_AMOUNTS, 
  MINIMUM_RECHARGE_AMOUNT, 
  MAXIMUM_RECHARGE_AMOUNT, 
  type RechargeOption 
} from '../../types/treasury';

interface RechargeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when recharge is confirmed */
  onRecharge: (amount: number) => Promise<void>;
  /** Current balance for display */
  currentBalance?: number;
}

/**
 * RechargeModal Component
 * 
 * Modal for clients to recharge their account balance.
 * Offers predefined amounts (50K, 100K, 200K, 500K FCFA) and custom amount option.
 */
export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onRecharge,
  currentBalance = 0
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const handleAmountSelect = (option: RechargeOption) => {
    setSelectedAmount(option.amount);
    setIsCustom(false);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setIsCustom(true);
    setSelectedAmount(null);
    setError(null);
  };

  const getFinalAmount = (): number => {
    if (isCustom && customAmount) {
      return parseInt(customAmount, 10);
    }
    return selectedAmount || 0;
  };

  const handleRecharge = async () => {
    const amount = getFinalAmount();
    
    if (amount < MINIMUM_RECHARGE_AMOUNT) {
      setError(`Le montant minimum est de ${formatPrice(MINIMUM_RECHARGE_AMOUNT)}`);
      return;
    }

    if (amount > MAXIMUM_RECHARGE_AMOUNT) {
      setError(`Le montant maximum est de ${formatPrice(MAXIMUM_RECHARGE_AMOUNT)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRecharge(amount);
      onClose();
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setIsCustom(false);
    setError(null);
  };

  if (!isOpen) return null;

  const finalAmount = getFinalAmount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recharger mon compte</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Balance */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Solde actuel</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(currentBalance)}</p>
          </div>

          {/* Predefined Amounts */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choisissez un montant
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_RECHARGE_AMOUNTS.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleAmountSelect(option)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedAmount === option.amount
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.isPopular && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Populaire
                    </span>
                  )}
                  <p className="font-semibold text-gray-900">{option.label}</p>
                  {selectedAmount === option.amount && (
                    <Check className="absolute top-2 right-2 h-5 w-5 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ou entrez un montant personnalisé
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Ex: 75000"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  isCustom ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                FCFA
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {formatPrice(MINIMUM_RECHARGE_AMOUNT)} | Maximum: {formatPrice(MAXIMUM_RECHARGE_AMOUNT)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          {finalAmount > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Montant à recharger</span>
                <span className="font-bold text-orange-600">{formatPrice(finalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Nouveau solde après recharge</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(currentBalance + finalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Réinitialiser
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleRecharge}
              disabled={finalAmount === 0 || isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4 w-4" />
              <span>{isLoading ? 'Traitement...' : 'Recharger'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeModal;
