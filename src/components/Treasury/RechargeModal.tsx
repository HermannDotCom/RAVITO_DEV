import React, { useState } from 'react';
import { X, CreditCard, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paymentMethod: string) => Promise<void>;
  currentBalance: number;
  formatValue?: (value: number) => string;
}

const predefinedAmounts = [
  { value: 20000, label: '20 000 FCFA' },
  { value: 50000, label: '50 000 FCFA' },
  { value: 100000, label: '100 000 FCFA' },
  { value: 200000, label: '200 000 FCFA' }
];

const paymentMethods = [
  { id: 'orange', name: 'Orange Money', icon: '🟠' },
  { id: 'mtn', name: 'MTN Mobile Money', icon: '🟡' },
  { id: 'moov', name: 'Moov Money', icon: '🔵' },
  { id: 'wave', name: 'Wave', icon: '🌊' },
  { id: 'card', name: 'Carte bancaire', icon: '💳' }
];

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentBalance,
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA'
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount, 10) : 0);
  const isValid = finalAmount >= 5000 && selectedPayment !== '';

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setCustomAmount(numericValue);
    setSelectedAmount(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!isValid) {
      setError('Veuillez sélectionner un montant et un mode de paiement');
      return;
    }

    if (finalAmount < 5000) {
      setError('Le montant minimum de recharge est de 5 000 FCFA');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onConfirm(finalAmount, selectedPayment);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedAmount(null);
        setCustomAmount('');
        setSelectedPayment('');
      }, 2000);
    } catch (err) {
      setError('Une erreur est survenue lors de la recharge. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setSelectedAmount(null);
      setCustomAmount('');
      setSelectedPayment('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recharger mon compte</h2>
                <p className="text-sm text-gray-500">
                  Solde actuel : {formatValue(currentBalance)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Recharge effectuée !</h3>
              <p className="text-gray-600">
                Votre compte a été crédité de {formatValue(finalAmount)}
              </p>
            </div>
          ) : (
            <>
              {/* Predefined Amounts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Montant de la recharge
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedAmounts.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleAmountSelect(value)}
                      className={`py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                        selectedAmount === value
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou saisissez un montant personnalisé
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Ex: 75 000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    FCFA
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum : 5 000 FCFA</p>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode de paiement
                </label>
                <div className="space-y-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        selectedPayment === method.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium text-gray-900">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Summary */}
              {finalAmount > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant à créditer</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatValue(finalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Nouveau solde</span>
                    <span className="font-semibold text-gray-900">
                      {formatValue(currentBalance + finalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
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
                  disabled={!isValid || isProcessing}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Recharger</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
