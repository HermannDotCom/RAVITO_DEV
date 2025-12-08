import React, { useState } from 'react';
import { MapPin, CreditCard, Smartphone, Archive, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { useAuth } from '../../context/AuthContext';
import { usePendingRatings } from '../../hooks/usePendingRatings';
import { PendingRatingModal } from '../Shared/PendingRatingModal';
import { PaymentMethod, CrateType } from '../../types';
import { ZoneSelector } from './ZoneSelector';

interface CheckoutFormProps {
  onConfirm: () => void;
  onBack: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onConfirm, onBack }) => {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const { placeOrder } = useOrder();
  const { commissionSettings } = useCommission();
  const { hasPendingRatings, loading: ratingsLoading } = usePendingRatings(user?.id || null);
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoneError, setZoneError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const { subtotal, consigneTotal } = getCartTotal();
  const clientCommission = Math.round((subtotal + consigneTotal) * (commissionSettings.clientCommission / 100));
  const total = subtotal + consigneTotal + clientCommission;

  // Calculate crate summary
  const getCrateSummary = () => {
    const crateSummary: { [key in CrateType]: number } = {
      C24: 0,
      C12: 0,
      C12V: 0,
      C6: 0
    };

    cart.forEach(item => {
      if (!item.withConsigne) {
        crateSummary[item.product.crateType] += item.quantity;
      }
    });

    return crateSummary;
  };

  const crateSummary = getCrateSummary();
  const totalCratesToReturn = Object.values(crateSummary).reduce((sum, count) => sum + count, 0);

  const paymentMethods = [
    { value: 'orange' as PaymentMethod, label: 'Orange Money', icon: Smartphone, color: 'orange' },
    { value: 'mtn' as PaymentMethod, label: 'MTN Mobile Money', icon: Smartphone, color: 'yellow' },
    { value: 'moov' as PaymentMethod, label: 'Moov Money', icon: Smartphone, color: 'blue' },
    { value: 'wave' as PaymentMethod, label: 'Wave', icon: Smartphone, color: 'purple' },
    { value: 'card' as PaymentMethod, label: 'Carte bancaire', icon: CreditCard, color: 'gray' }
  ];

  const handleConfirmOrder = async () => {
    if (hasPendingRatings) {
      setShowRatingModal(true);
      return;
    }

    if (!deliveryZone) {
      setZoneError('Veuillez sélectionner votre zone de livraison');
      return;
    }
    if (!deliveryAddress.trim()) return;

    setIsProcessing(true);
    setZoneError('');

    const coordinates = { lat: 5.3364, lng: -4.0267 };

    const result = await placeOrder(
      cart,
      deliveryAddress,
      coordinates,
      paymentMethod,
      commissionSettings,
      deliveryZone
    );

    if (result.success) {
      clearCart();
      setTimeout(() => {
        setIsProcessing(false);
        onConfirm();
      }, 1000);
    } else {
      alert('Erreur lors de la création de la commande: ' + (result.error || 'Erreur inconnue'));
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <>
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finaliser la commande</h1>
        <p className="text-gray-600">Vérifiez les détails et confirmez votre commande</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Zone */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Zone de livraison
            </h3>
            <ZoneSelector
              value={deliveryZone}
              onChange={setDeliveryZone}
              required={true}
              error={zoneError}
            />
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Important :</strong> Seuls les fournisseurs inscrits dans votre zone pourront voir et accepter votre commande.
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Adresse de livraison
            </h3>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              placeholder="Entrez votre adresse précise de livraison avec points de repère..."
              required
            />
          </div>

          {/* Crate Return Information */}
          {totalCratesToReturn > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Archive className="h-5 w-5 mr-2 text-blue-600" />
                Casiers vides à rendre (interchangeables par type)
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {Object.entries(crateSummary).map(([crateType, count]) => (
                    count > 0 && (
                      <div key={crateType} className="bg-white rounded p-3 text-center">
                        <div className="text-lg font-bold text-blue-700">{count}</div>
                        <div className="text-blue-600 text-sm">{crateType}</div>
                        <div className="text-blue-500 text-xs mt-1">
                          {crateType === 'C24' ? '24×33cl' : 
                           crateType === 'C12' ? '12×66cl' : 
                           crateType === 'C12V' ? '12×75cl' : '6×1.5L'}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                <div className="bg-white border border-blue-300 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    ⚠️ <strong>Total : {totalCratesToReturn} casier(s) vide(s) à rendre obligatoirement</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    💡 <strong>Casiers interchangeables :</strong> Vous pouvez rendre n'importe quel casier vide du même type, 
                    peu importe la marque d'origine (ex: casier C24 Flag = casier C24 Castel).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mode de paiement (après acceptation)</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Paiement différé</p>
                  <p>Le paiement sera demandé uniquement après qu'un fournisseur ait accepté votre commande.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const MethodIcon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all flex items-center space-x-3 ${
                      paymentMethod === method.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <MethodIcon className={`h-5 w-5 ${
                      paymentMethod === method.value ? 'text-orange-600' : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      paymentMethod === method.value ? 'text-orange-700' : 'text-gray-700'
                    }`}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total produits</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {consigneTotal > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Total consignes</span>
                  <span>{formatPrice(consigneTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-blue-600">
                <span>Frais DISTRI-NIGHT ({commissionSettings.clientCommission}%)</span>
                <span>{formatPrice(clientCommission)}</span>
              </div>
              <div className="text-xs text-blue-500 -mt-1">
                Frais de traitement de la plateforme
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmOrder}
                disabled={!deliveryZone || !deliveryAddress.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Traitement...' : 'Confirmer la commande'}
              </button>
              
              <button
                onClick={onBack}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Retour au panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showRatingModal && (
      <PendingRatingModal
        userRole="client"
        onClose={() => setShowRatingModal(false)}
        onGoToRating={() => {
          setShowRatingModal(false);
        }}
      />
    )}
    </>
  );
};