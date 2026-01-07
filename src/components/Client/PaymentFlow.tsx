import React, { useState } from 'react';
import { CreditCard, Smartphone, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';

interface PaymentFlowProps {
  order: Order;
  onPaymentComplete: (paymentMethod: PaymentMethod, transactionId: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  order,
  onPaymentComplete,
  onCancel,
  isProcessing = false
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('orange');
  const [transactionId, setTransactionId] = useState('');
  const [step, setStep] = useState<'method' | 'confirm' | 'processing'>('method');
  const [error, setError] = useState('');

  // Use order.totalAmount which includes commission after offer acceptance
  const total = order.totalAmount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const paymentMethods = [
    {
      value: 'orange' as PaymentMethod,
      label: 'Orange Money',
      icon: Smartphone,
      color: 'orange',
      description: 'Paiement par Orange Money'
    },
    {
      value: 'mtn' as PaymentMethod,
      label: 'MTN Mobile Money',
      icon: Smartphone,
      color: 'yellow',
      description: 'Paiement par MTN Mobile Money'
    },
    {
      value: 'moov' as PaymentMethod,
      label: 'Moov Money',
      icon: Smartphone,
      color: 'blue',
      description: 'Paiement par Moov Money'
    },
    {
      value: 'wave' as PaymentMethod,
      label: 'Wave',
      icon: Smartphone,
      color: 'purple',
      description: 'Paiement par Wave'
    },
    {
      value: 'card' as PaymentMethod,
      label: 'Carte bancaire',
      icon: CreditCard,
      color: 'gray',
      description: 'Paiement par carte bancaire'
    }
  ];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setError('');
  };

  const handleConfirmPayment = () => {
    if (!transactionId.trim()) {
      setError('Veuillez entrer l\'ID de transaction');
      return;
    }

    setStep('processing');
    
    // Simuler un délai de traitement
    setTimeout(() => {
      onPaymentComplete(selectedPaymentMethod, transactionId);
    }, 1500);
  };

  const selectedMethod = paymentMethods.find(m => m.value === selectedPaymentMethod);
  const MethodIcon = selectedMethod?.icon || Smartphone;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Paiement de commande</h2>
          {step !== 'processing' && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Commande #{order.id}</p>
            {order.baseAmount && order.clientCommissionAmount ? (
              <>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600">Montant offre :</span>
                  <span className="font-medium text-gray-700">{formatPrice(order.baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Commission RAVITO (4%) :</span>
                  <span className="font-medium text-orange-600">{formatPrice(order.clientCommissionAmount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2 pt-2 border-t border-orange-300">
                  <span className="text-gray-700 font-semibold">Total à payer :</span>
                  <span className="text-2xl font-bold text-orange-600">{formatPrice(total)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Montant total :</span>
                <span className="text-2xl font-bold text-orange-600">{formatPrice(total)}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              {order.items.length} article(s) - Livraison à {order.deliveryAddress}
            </p>
          </div>

          {step === 'method' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisir un moyen de paiement</h3>
              
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => handlePaymentMethodSelect(method.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                      selectedPaymentMethod === method.value
                        ? `border-${method.color}-500 bg-${method.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MethodIcon className={`h-6 w-6 text-${method.color}-600`} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.description}</p>
                    </div>
                    {selectedPaymentMethod === method.value && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('confirm')}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Continuer
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer le paiement</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Instructions de paiement :</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Composez <strong>*144#</strong> sur votre téléphone</li>
                      <li>Sélectionnez l'option de paiement</li>
                      <li>Entrez le montant : <strong>{formatPrice(total)}</strong></li>
                      <li>Confirmez la transaction</li>
                      <li>Notez l'ID de transaction reçu</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de transaction
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    setError('');
                  }}
                  placeholder="Entrez l'ID de transaction reçu"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  disabled={isProcessing}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || !transactionId.trim()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Confirmer le paiement</span>
                </button>
                <button
                  onClick={() => setStep('method')}
                  disabled={isProcessing}
                  className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Retour
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4">
                  <Loader className="h-8 w-8 text-orange-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Traitement du paiement</h3>
              <p className="text-gray-600 text-center">
                Veuillez patienter pendant que nous traitons votre paiement...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
