import React, { useState } from 'react';
import { X, Banknote, AlertCircle, CheckCircle, CreditCard, Info } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, iban: string) => Promise<void>;
  availableBalance: number;
  pendingBalance?: number;
  bankInfo?: {
    iban: string;
    bankName: string;
  };
  formatValue?: (value: number) => string;
}

// Minimum withdrawal amount in FCFA (50,000 FCFA as per business requirement)
const MINIMUM_WITHDRAWAL = 50000;

// IBAN validation regex pattern - validates basic IBAN format
// IBAN: 2 letter country code + 2 check digits + up to 30 alphanumeric characters
const IBAN_PATTERN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

const validateIban = (iban: string): boolean => {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Check basic format
  if (!IBAN_PATTERN.test(cleanIban)) {
    return false;
  }
  
  // Check minimum length (varies by country, but minimum is 15)
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }
  
  return true;
};

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableBalance,
  pendingBalance = 0,
  bankInfo,
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA'
}) => {
  const [amount, setAmount] = useState<string>('');
  const [customIban, setCustomIban] = useState<string>('');
  const [useStoredIban, setUseStoredIban] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const withdrawalAmount = amount ? parseInt(amount, 10) : 0;
  const selectedIban = useStoredIban && bankInfo ? bankInfo.iban : customIban;
  const isValidAmount = withdrawalAmount >= MINIMUM_WITHDRAWAL && withdrawalAmount <= availableBalance;
  const isValidIban = useStoredIban && bankInfo ? true : validateIban(selectedIban);
  const isValid = isValidAmount && isValidIban;

  const maskIban = (iban: string) => {
    if (iban.length < 8) return iban;
    return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
    setError(null);
  };

  const handleMaxAmount = () => {
    setAmount(String(Math.floor(availableBalance)));
    setError(null);
  };

  const handleConfirm = async () => {
    if (!isValid) {
      if (withdrawalAmount < MINIMUM_WITHDRAWAL) {
        setError(`Le montant minimum de retrait est de ${formatValue(MINIMUM_WITHDRAWAL)}`);
      } else if (withdrawalAmount > availableBalance) {
        setError('Le montant demandé dépasse votre solde disponible');
      } else if (!isValidIban) {
        setError('Veuillez saisir un IBAN valide');
      }
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onConfirm(withdrawalAmount, selectedIban);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAmount('');
        setCustomIban('');
      }, 2000);
    } catch (err) {
      setError('Une erreur est survenue lors de la demande de retrait. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setAmount('');
      setCustomIban('');
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
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Demander un retrait</h2>
                <p className="text-sm text-gray-500">
                  Disponible : {formatValue(availableBalance)}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Demande envoyée !</h3>
              <p className="text-gray-600">
                Votre demande de retrait de {formatValue(withdrawalAmount)} a été enregistrée.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Le virement sera effectué sous 24 à 48 heures.
              </p>
            </div>
          ) : (
            <>
              {/* Available Balance Info */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Solde disponible pour retrait</p>
                    <p className="text-xl font-bold text-green-800">{formatValue(availableBalance)}</p>
                  </div>
                </div>
                {pendingBalance > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    + {formatValue(pendingBalance)} en attente de validation
                  </p>
                )}
              </div>

              {/* Withdrawal Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant du retrait
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Ex: 100 000"
                    className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={handleMaxAmount}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum : {formatValue(MINIMUM_WITHDRAWAL)}
                </p>
              </div>

              {/* IBAN Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte bancaire
                </label>
                
                {bankInfo && (
                  <div className="mb-3">
                    <button
                      onClick={() => setUseStoredIban(true)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        useStoredIban
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          useStoredIban ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {useStoredIban && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{bankInfo.bankName}</p>
                          <p className="text-sm text-gray-500">{maskIban(bankInfo.iban)}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setUseStoredIban(false)}
                  className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                    !useStoredIban
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      !useStoredIban ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {!useStoredIban && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {bankInfo ? 'Utiliser un autre compte' : 'Saisir l\'IBAN'}
                    </span>
                  </div>
                </button>

                {!useStoredIban && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customIban}
                      onChange={(e) => setCustomIban(e.target.value.toUpperCase())}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Informations sur les retraits</p>
                  <ul className="text-xs space-y-1">
                    <li>• Délai de traitement : 24 à 48 heures</li>
                    <li>• Minimum : {formatValue(MINIMUM_WITHDRAWAL)}</li>
                    <li>• Aucun frais de retrait</li>
                  </ul>
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
              {withdrawalAmount > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant à retirer</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatValue(withdrawalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Nouveau solde</span>
                    <span className="font-semibold text-gray-900">
                      {formatValue(Math.max(0, availableBalance - withdrawalAmount))}
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
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" />
                      <span>Demander le retrait</span>
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
