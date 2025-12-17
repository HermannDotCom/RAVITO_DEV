/**
 * Supplier Withdrawal Request Component
 * Modal for suppliers to request withdrawals
 */

import React, { useState } from 'react';
import { X, Smartphone, Building2, Check, AlertCircle, Info } from 'lucide-react';
import { useWallet } from '../../../context/WalletContext';
import { WALLET_LIMITS, WithdrawalMethod } from '../../../types/wallet';
import { calculateWithdrawalFee } from '../../../services/walletService';

interface SupplierWithdrawalRequestProps {
  onClose: () => void;
}

export const SupplierWithdrawalRequest: React.FC<SupplierWithdrawalRequestProps> = ({ onClose }) => {
  const { balance, requestWithdrawal } = useWallet();
  const [amount, setAmount] = useState(balance.toString());
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>('orange');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const withdrawalMethods = [
    { id: 'orange' as WithdrawalMethod, name: 'Orange Money', icon: Smartphone, color: 'bg-orange-500' },
    { id: 'mtn' as WithdrawalMethod, name: 'MTN Mobile Money', icon: Smartphone, color: 'bg-yellow-500' },
    { id: 'moov' as WithdrawalMethod, name: 'Moov Money', icon: Smartphone, color: 'bg-blue-500' },
    { id: 'wave' as WithdrawalMethod, name: 'Wave', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'bank_transfer' as WithdrawalMethod, name: 'Virement Bancaire', icon: Building2, color: 'bg-green-600' }
  ];

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

  const handleWithdrawAll = () => {
    setAmount(balance.toString());
  };

  const calculateFee = (): number => {
    if (!amount) return 0;
    return calculateWithdrawalFee(parseInt(amount), selectedMethod);
  };

  const calculateNetAmount = (): number => {
    if (!amount) return 0;
    const numAmount = parseInt(amount);
    const fee = calculateFee();
    return numAmount - fee;
  };

  const validateForm = (): boolean => {
    const numAmount = parseInt(amount);
    
    if (!amount || numAmount <= 0) {
      setError('Veuillez entrer un montant');
      return false;
    }

    if (numAmount < WALLET_LIMITS.MIN_WITHDRAWAL) {
      setError(`Le montant minimum est de ${formatCurrency(WALLET_LIMITS.MIN_WITHDRAWAL)}`);
      return false;
    }

    if (numAmount > WALLET_LIMITS.MAX_WITHDRAWAL) {
      setError(`Le montant maximum est de ${formatCurrency(WALLET_LIMITS.MAX_WITHDRAWAL)}`);
      return false;
    }

    if (numAmount > balance) {
      setError('Solde insuffisant');
      return false;
    }

    if (!accountNumber.trim()) {
      setError('Veuillez entrer le numéro de compte');
      return false;
    }

    if (!accountName.trim()) {
      setError('Veuillez entrer le nom du bénéficiaire');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const numAmount = parseInt(amount);
      
      const accountDetails = {
        accountNumber,
        accountName,
        operator: selectedMethod !== 'bank_transfer' ? selectedMethod : undefined,
        method: selectedMethod
      };

      const result = await requestWithdrawal(numAmount, selectedMethod, accountDetails);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Erreur lors de la demande de retrait');
      }
    } catch (error) {
      console.error('Error in requestWithdrawal:', error);
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Demande enregistrée!</h3>
          <p className="text-gray-600 mb-4">
            Votre demande de retrait de {formatCurrency(parseInt(amount))} a été soumise avec succès.
          </p>
          <p className="text-sm text-gray-500">
            Elle sera traitée sous 24 heures (simulation).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Demander un retrait</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Balance Display */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-800">Solde disponible</span>
              <span className="text-xl font-bold text-green-900">{formatCurrency(balance)}</span>
            </div>
            <button
              type="button"
              onClick={handleWithdrawAll}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Retirer tout le solde
            </button>
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
                placeholder="0"
                className="w-full text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl p-4 focus:border-green-500 focus:ring-0 outline-none"
                disabled={isProcessing}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">
                XOF
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Min: {formatCurrency(WALLET_LIMITS.MIN_WITHDRAWAL)} - Max: {formatCurrency(WALLET_LIMITS.MAX_WITHDRAWAL)}
            </p>
          </div>

          {/* Fee Calculation Display */}
          {amount && parseInt(amount) > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant demandé</span>
                <span className="font-medium text-gray-900">{formatCurrency(parseInt(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais de retrait (2%)</span>
                <span className="font-medium text-red-600">- {formatCurrency(calculateFee())}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-medium text-gray-900">Montant net reçu</span>
                <span className="font-bold text-green-600">{formatCurrency(calculateNetAmount())}</span>
              </div>
            </div>
          )}

          {/* Withdrawal Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Moyen de retrait
            </label>
            <div className="grid grid-cols-1 gap-3">
              {withdrawalMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      selectedMethod === method.id
                        ? 'border-green-500 bg-green-50'
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

          {/* Account Details */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedMethod === 'bank_transfer' ? 'Numéro de compte bancaire' : 'Numéro de téléphone'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={selectedMethod === 'bank_transfer' ? 'CI00 0000 0000 0000 0000 00' : '+225 XX XX XX XX XX'}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-0 outline-none"
                disabled={isProcessing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du bénéficiaire
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nom complet"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-0 outline-none"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Traitement automatique sous 24h</p>
                <p>
                  Votre demande sera traitée automatiquement dans les 24 heures (simulation MVP). 
                  Les fonds seront transférés vers votre compte {selectedMethod === 'bank_transfer' ? 'bancaire' : 'Mobile Money'}.
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
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !amount || !accountNumber || !accountName}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Traitement...
                </span>
              ) : (
                'Confirmer le retrait'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
