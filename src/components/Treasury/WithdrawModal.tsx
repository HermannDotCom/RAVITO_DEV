import React, { useState } from 'react';
import { X, Banknote, Building2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  availableBalance: number;
  bankInfo?: {
    iban: string;
    bankName: string;
    accountHolder: string;
  };
  formatPrice?: (price: number) => string;
}

const MIN_WITHDRAWAL = 50000; // 50,000 FCFA minimum

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableBalance,
  bankInfo = {
    iban: 'CI** **** **** **** ****',
    bankName: 'Banque XYZ',
    accountHolder: 'Nom du titulaire'
  },
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA'
}) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Parse amount as integer (FCFA doesn't have decimal places)
  // Use Math.floor to ensure we don't have any floating point precision issues
  const parsedAmount = Math.floor(Number(amount.replace(/\D/g, '')) || 0);
  const isValidAmount = parsedAmount >= MIN_WITHDRAWAL && parsedAmount <= availableBalance;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
  };

  const handleConfirm = async () => {
    if (!isValidAmount) return;

    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Auto close after success
    setTimeout(() => {
      onConfirm(parsedAmount);
      setIsSuccess(false);
      setAmount('');
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Demande de retrait</h2>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h3>
              <p className="text-gray-600 mb-4">
                Votre demande de retrait de {formatPrice(parsedAmount)} a été enregistrée.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Délai: 3-5 jours ouvrés</span>
              </div>
            </div>
          ) : (
            <>
              {/* Available Balance */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Solde disponible</span>
                  <span className="text-xl font-bold text-green-600">{formatPrice(availableBalance)}</span>
                </div>
              </div>

              {/* Minimum Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Montant minimum de retrait: <strong>{formatPrice(MIN_WITHDRAWAL)}</strong>
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à retirer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isProcessing}
                    placeholder="Ex: 100000"
                    className={`w-full px-4 py-3 border-2 rounded-xl text-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      parsedAmount > 0 && !isValidAmount 
                        ? 'border-red-300 bg-red-50' 
                        : parsedAmount > 0 && isValidAmount
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    FCFA
                  </span>
                </div>
                {parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL && (
                  <p className="text-red-600 text-sm mt-1">Le montant minimum est de {formatPrice(MIN_WITHDRAWAL)}</p>
                )}
                {parsedAmount > availableBalance && (
                  <p className="text-red-600 text-sm mt-1">Montant supérieur au solde disponible</p>
                )}
                <button
                  onClick={handleWithdrawAll}
                  disabled={isProcessing || availableBalance < MIN_WITHDRAWAL}
                  className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  Retirer tout ({formatPrice(availableBalance)})
                </button>
              </div>

              {/* Bank Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Informations bancaires</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banque</span>
                    <span className="font-medium text-gray-900">{bankInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IBAN</span>
                    <span className="font-mono text-gray-900">{bankInfo.iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Titulaire</span>
                    <span className="font-medium text-gray-900">{bankInfo.accountHolder}</span>
                  </div>
                </div>
              </div>

              {/* Processing Time Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Délai de traitement</h4>
                    <p className="text-sm text-blue-700">
                      Les virements sont généralement effectués sous 3 à 5 jours ouvrés après validation.
                    </p>
                  </div>
                </div>
              </div>
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
                disabled={isProcessing || !isValidAmount}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <span>Demander le retrait</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
