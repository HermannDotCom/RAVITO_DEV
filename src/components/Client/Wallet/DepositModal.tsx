/**
 * Deposit Modal Component
 * Allows clients to add funds to their wallet (simulated)
 */

import React, { useState } from 'react';
import { X, Smartphone, CreditCard, Building2, Check, AlertCircle } from 'lucide-react';
import { useWallet } from '../../../context/WalletContext';
import { WALLET_LIMITS } from '../../../types/wallet';

interface DepositModalProps {
  onClose: () => void;
}

type PaymentMethod = 'orange' | 'mtn' | 'moov' | 'wave' | 'card' | 'bank';

export const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { deposit } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('orange');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { id: 'orange' as PaymentMethod, name: 'Orange Money', icon: Smartphone, color: 'bg-orange-500' },
    { id: 'mtn' as PaymentMethod, name: 'MTN Mobile Money', icon: Smartphone, color: 'bg-yellow-500' },
    { id: 'moov' as PaymentMethod, name: 'Moov Money', icon: Smartphone, color: 'bg-blue-500' },
    { id: 'wave' as PaymentMethod, name: 'Wave', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'card' as PaymentMethod, name: 'Carte Bancaire', icon: CreditCard, color: 'bg-gray-700' },
    { id: 'bank' as PaymentMethod, name: 'Virement Bancaire', icon: Building2, color: 'bg-green-600' }
  ];

  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const validateAmount = (): boolean => {
    const numAmount = parseInt(amount);
    
    if (!amount || numAmount <= 0) {
      setError('Veuillez entrer un montant');
      return false;
    }

    if (numAmount < WALLET_LIMITS.MIN_DEPOSIT) {
      setError(`Le montant minimum est de ${formatCurrency(WALLET_LIMITS.MIN_DEPOSIT)}`);
      return false;
    }

    if (numAmount > WALLET_LIMITS.MAX_DEPOSIT) {
      setError(`Le montant maximum est de ${formatCurrency(WALLET_LIMITS.MAX_DEPOSIT)}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAmount()) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const numAmount = parseInt(amount);
      const methodName = paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await deposit(
        numAmount,
        selectedMethod,
        `Dépôt via ${methodName}`
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors du dépôt');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Dépôt réussi!</h3>
          <p className="text-gray-600 mb-4">
            {formatCurrency(parseInt(amount))} ont été ajoutés à votre portefeuille
          </p>
          <div className="animate-pulse text-orange-500 text-sm">
            Mise à jour du solde en cours...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Ajouter des fonds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à déposer
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl p-4 focus:border-orange-500 focus:ring-0 outline-none"
                disabled={isProcessing}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">
                XOF
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Min: {formatCurrency(WALLET_LIMITS.MIN_DEPOSIT)} - Max: {formatCurrency(WALLET_LIMITS.MAX_DEPOSIT)}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montants rapides
            </label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="bg-gray-100 hover:bg-orange-50 border-2 border-transparent hover:border-orange-500 rounded-lg p-3 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                  disabled={isProcessing}
                >
                  {quickAmount / 1000}K
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Moyen de paiement (Simulation)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      selectedMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isProcessing}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${method.color} p-2 rounded-lg text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{method.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Phase MVP - Simulation</p>
                <p>
                  Cette fonctionnalité est actuellement en simulation. Aucune transaction bancaire réelle
                  ne sera effectuée. Les fonds seront ajoutés instantanément à votre portefeuille RAVITO.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !amount}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Traitement...
                </span>
              ) : (
                `Déposer ${amount ? formatCurrency(parseInt(amount)) : '0 XOF'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
