import React, { useState } from 'react';
import { CreditCard, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';
import { supabase } from '../../lib/supabase';
import { PaymentProcessorFactory, WebhookSimulator } from '../../services/payment';

interface PaymentInterfaceProps {
  order: Order;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  order,
  onPaymentSuccess,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const paymentMethods = [
    { value: 'orange' as PaymentMethod, label: 'Orange Money', icon: Smartphone, color: 'orange' },
    { value: 'mtn' as PaymentMethod, label: 'MTN Mobile Money', icon: Smartphone, color: 'yellow' },
    { value: 'moov' as PaymentMethod, label: 'Moov Money', icon: Smartphone, color: 'blue' },
    { value: 'wave' as PaymentMethod, label: 'Wave', icon: Smartphone, color: 'indigo' },
    { value: 'card' as PaymentMethod, label: 'Carte bancaire', icon: CreditCard, color: 'gray' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handlePayment = async () => {
    if (!phoneNumber && selectedMethod !== 'card') {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get the appropriate payment processor
      const processor = PaymentProcessorFactory.getProcessor(selectedMethod);
      
      // Process payment through the payment gateway
      const paymentResponse = await processor.processPayment({
        orderId: order.id,
        amount: order.totalAmount,
        paymentMethod: selectedMethod,
        phoneNumber: phoneNumber,
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'Échec du paiement');
      }

      // Simulate webhook callback (in production, this would be triggered by the payment provider)
      await WebhookSimulator.simulateWebhook(
        order.id,
        paymentResponse.transactionId,
        paymentResponse.reference,
        paymentResponse.status === 'success' ? 'success' : 'failed',
        order.totalAmount,
        selectedMethod
      );

      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement. Veuillez réessayer.');
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement réussi !
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Votre commande est confirmée. Le fournisseur va préparer votre livraison.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paiement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Commande #{order.id.slice(0, 8)}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {order.baseAmount && order.clientCommissionAmount ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Montant offre</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatPrice(order.baseAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Commission RAVITO (4%)</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {formatPrice(order.clientCommissionAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    Total à payer
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Montant à payer
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Méthode de paiement
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    onClick={() => setSelectedMethod(method.value)}
                    disabled={isProcessing}
                    className={`p-4 border-2 rounded-lg text-left transition-all flex items-center space-x-3 ${
                      selectedMethod === method.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    } disabled:opacity-50`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        selectedMethod === method.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedMethod === method.value
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMethod !== 'card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
                placeholder="Ex: 07 XX XX XX XX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Vous recevrez une notification pour confirmer le paiement
              </p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Important:</strong> Une fois le paiement effectué, l'identité du fournisseur vous sera révélée
              et il pourra préparer votre commande.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || (!phoneNumber && selectedMethod !== 'card')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Traitement...
              </>
            ) : (
              <>Payer {formatPrice(order.totalAmount)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
