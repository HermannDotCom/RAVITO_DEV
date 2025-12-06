import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, Plus } from 'lucide-react';
import { DEFAULT_RECHARGE_AMOUNTS, MINIMUM_RECHARGE_AMOUNT, MAXIMUM_RECHARGE_AMOUNT } from '../../types/treasury';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  currentBalance?: number;
  formatPrice?: (price: number) => string;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentBalance = 0,
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA'
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getFinalAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseInt(customAmount, 10);
    return 0;
  };

  const isValidAmount = (amount: number) => {
    return amount >= MINIMUM_RECHARGE_AMOUNT && amount <= MAXIMUM_RECHARGE_AMOUNT;
  };

  const handleConfirm = async () => {
    const amount = getFinalAmount();
    if (amount <= 0 || !isValidAmount(amount)) return;

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Auto close after success
    setTimeout(() => {
      onConfirm(amount);
      setIsSuccess(false);
      setSelectedAmount(null);
      setCustomAmount('');
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedAmount(null);
      setCustomAmount('');
      setIsSuccess(false);
      onClose();
    }
  };

  const finalAmount = getFinalAmount();
  const newBalance = currentBalance + finalAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recharger mon compte</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement réussi !</h3>
              <p className="text-gray-600">
                Votre compte a été rechargé de {formatPrice(finalAmount)}
              </p>
            </div>
          ) : (
            <>
              {/* Current Balance Card */}
              {currentBalance > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-700 text-sm">Solde actuel</span>
                    <span className="text-lg font-bold text-orange-600">{formatPrice(currentBalance)}</span>
                  </div>
                </div>
              )}

              {/* Predefined Amounts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choisissez un montant
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DEFAULT_RECHARGE_AMOUNTS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAmountSelect(option.amount)}
                      disabled={isProcessing}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedAmount === option.amount
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option.isPopular && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Populaire
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        {option.label}
                      </span>
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
                    onChange={handleCustomAmountChange}
                    disabled={isProcessing}
                    placeholder="Ex: 75000"
                    className={`w-full px-4 py-3 border-2 rounded-xl text-lg font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      customAmount && !selectedAmount ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    FCFA
                  </span>
                </div>
                {customAmount && parseInt(customAmount, 10) < MINIMUM_RECHARGE_AMOUNT && (
                  <p className="text-red-600 text-sm mt-1">
                    Le montant minimum est de {formatPrice(MINIMUM_RECHARGE_AMOUNT)}
                  </p>
                )}
                {customAmount && parseInt(customAmount, 10) > MAXIMUM_RECHARGE_AMOUNT && (
                  <p className="text-red-600 text-sm mt-1">
                    Le montant maximum est de {formatPrice(MAXIMUM_RECHARGE_AMOUNT)}
                  </p>
                )}
              </div>

              {/* Payment Method Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Mode de paiement</h4>
                    <p className="text-sm text-blue-700">
                      Pour le MVP, le paiement est simulé. Dans la version finale, 
                      vous pourrez utiliser Orange Money, MTN Money, Wave ou carte bancaire.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {finalAmount > 0 && isValidAmount(finalAmount) && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Montant à recharger</span>
                      <span className="font-medium text-gray-900">{formatPrice(finalAmount)}</span>
                    </div>
                    {currentBalance > 0 && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Solde actuel</span>
                          <span className="font-medium text-gray-900">{formatPrice(currentBalance)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 font-medium">Nouveau solde</span>
                            <span className="text-xl font-bold text-orange-600">{formatPrice(newBalance)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || finalAmount <= 0 || !isValidAmount(finalAmount)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <span>Confirmer le paiement</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
