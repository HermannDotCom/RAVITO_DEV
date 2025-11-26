import React, { useState } from 'react';
import { X, Banknote, AlertCircle, Check, Building2, Clock } from 'lucide-react';
import { MINIMUM_WITHDRAWAL_AMOUNT } from '../../types/treasury';

interface WithdrawalModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when withdrawal is requested */
  onWithdraw: (amount: number) => Promise<void>;
  /** Current available balance */
  availableBalance: number;
  /** IBAN last 4 digits for display */
  ibanLast4?: string;
  /** Commission rate percentage */
  commissionRate?: number;
}

/**
 * WithdrawalModal Component
 * 
 * Modal for suppliers to request withdrawals from their balance.
 * Includes minimum amount validation (50,000 FCFA) and IBAN display.
 */
export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onWithdraw,
  availableBalance,
  ibanLast4,
  commissionRate = 5
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError(null);
  };

  const getAmountValue = (): number => {
    return amount ? parseInt(amount, 10) : 0;
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
    setError(null);
  };

  const validateWithdrawal = (): boolean => {
    const amountValue = getAmountValue();

    if (amountValue < MINIMUM_WITHDRAWAL_AMOUNT) {
      setError(`Le montant minimum de retrait est de ${formatPrice(MINIMUM_WITHDRAWAL_AMOUNT)}`);
      return false;
    }

    if (amountValue > availableBalance) {
      setError('Le montant dépasse votre solde disponible');
      return false;
    }

    return true;
  };

  const handleRequestWithdrawal = () => {
    if (!validateWithdrawal()) return;
    setIsConfirming(true);
  };

  const handleConfirmWithdrawal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onWithdraw(getAmountValue());
      onClose();
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsConfirming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming) {
      setIsConfirming(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const amountValue = getAmountValue();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isConfirming ? 'Confirmer le retrait' : 'Demander un retrait'}
            </h2>
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
          {!isConfirming ? (
            <>
              {/* Available Balance */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">Solde disponible</p>
                <p className="text-2xl font-bold text-green-800">{formatPrice(availableBalance)}</p>
              </div>

              {/* Bank Account Info */}
              {ibanLast4 && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-6">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compte bancaire</p>
                    <p className="text-sm text-gray-500">IBAN se terminant par •••• {ibanLast4}</p>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à retirer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={`Minimum: ${formatPrice(MINIMUM_WITHDRAWAL_AMOUNT)}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Minimum: {formatPrice(MINIMUM_WITHDRAWAL_AMOUNT)}
                  </p>
                  <button
                    onClick={handleWithdrawAll}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Retirer tout
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Délai de traitement</p>
                    <p className="text-sm text-blue-700">
                      Les retraits sont traités sous 3 à 5 jours ouvrés après validation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Confirmation View */}
              <div className="text-center mb-6">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer le retrait
                </h3>
                <p className="text-gray-600">
                  Vous êtes sur le point de demander un retrait de:
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-center text-3xl font-bold text-green-600">
                  {formatPrice(amountValue)}
                </p>
                {ibanLast4 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Vers le compte •••• {ibanLast4}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Attention</p>
                    <p className="text-sm text-yellow-700">
                      Cette action ne peut pas être annulée. Le montant sera déduit de votre solde immédiatement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 space-x-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isConfirming ? 'Retour' : 'Annuler'}
          </button>
          <button
            onClick={isConfirming ? handleConfirmWithdrawal : handleRequestWithdrawal}
            disabled={amountValue === 0 || isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <Check className="h-4 w-4" />
                <span>{isLoading ? 'Traitement...' : 'Confirmer'}</span>
              </>
            ) : (
              <>
                <Banknote className="h-4 w-4" />
                <span>Demander le retrait</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
