import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentModalProps {
  amount: number;
  paymentMethod: PaymentMethod;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  paymentMethod,
  onSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case 'orange':
        return {
          name: 'Orange Money',
          color: 'orange',
          icon: Smartphone,
          code: '#144#',
          instructions: 'Composez #144# sur votre téléphone Orange'
        };
      case 'mtn':
        return {
          name: 'MTN Mobile Money',
          color: 'yellow',
          icon: Smartphone,
          code: '*133#',
          instructions: 'Composez *133# sur votre téléphone MTN'
        };
      case 'moov':
        return {
          name: 'Moov Money',
          color: 'blue',
          icon: Smartphone,
          code: '#155#',
          instructions: 'Composez #155# sur votre téléphone Moov'
        };
      case 'wave':
        return {
          name: 'Wave',
          color: 'purple',
          icon: Smartphone,
          code: 'App Wave',
          instructions: 'Ouvrez votre application Wave'
        };
      case 'card':
        return {
          name: 'Carte bancaire',
          color: 'gray',
          icon: CreditCard,
          code: '',
          instructions: 'Paiement par carte bancaire sécurisé'
        };
      default:
        return {
          name: 'Paiement',
          color: 'gray',
          icon: CreditCard,
          code: '',
          instructions: ''
        };
    }
  };

  const paymentInfo = getPaymentMethodInfo();
  const PaymentIcon = paymentInfo.icon;

  const handlePayment = async () => {
    if (paymentMethod !== 'card' && !phoneNumber) return;
    if (paymentMethod !== 'card' && !pin) return;

    setPaymentStep('processing');
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate success (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      setPaymentStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    if (paymentMethod === 'card') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              Vous allez être redirigé vers la plateforme de paiement sécurisée de votre banque
            </p>
          </div>
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Procéder au paiement sécurisé
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="+225 XX XX XX XX XX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Votre code PIN"
            maxLength={4}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 text-center">
            {paymentInfo.instructions}
          </p>
          {paymentInfo.code && (
            <p className="text-sm font-mono text-center text-gray-800 mt-1">
              Code USSD : {paymentInfo.code}
            </p>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={!phoneNumber || !pin}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Confirmer le paiement
        </button>
      </div>
    );
  };

  if (paymentStep === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Traitement du paiement</h2>
          <p className="text-gray-600 mb-4">Veuillez patienter...</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Vérification du paiement via {paymentInfo.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h2>
          <p className="text-gray-600 mb-4">Votre commande est confirmée</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Les coordonnées du fournisseur vont vous être communiquées
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Échec du paiement</h2>
          <p className="text-gray-600 mb-6">Une erreur s'est produite lors du traitement</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setPaymentStep('confirm');
                setPin('');
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Réessayer
            </button>
            <button
              onClick={onCancel}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className={`h-16 w-16 bg-gradient-to-br from-${paymentInfo.color}-500 to-${paymentInfo.color}-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <PaymentIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement</h2>
          <p className="text-gray-600">{paymentInfo.name}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(amount)}</p>
        </div>

        {renderPaymentForm()}

        <div className="mt-4">
          <button
            onClick={onCancel}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};