import React, { useState } from 'react';
import { MapPin, CreditCard, Smartphone, Archive, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { useAuth } from '../../context/AuthContext';
import { usePendingRatings } from '../../hooks/usePendingRatings';
import { PendingRatingModal } from '../Shared/PendingRatingModal';
import { LocationPicker } from '../Shared/LocationPicker';
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
  const [deliveryZone, setDeliveryZone] = useState(user?.zoneId || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(user?.deliveryLatitude || null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(user?.deliveryLongitude || null);
  const [deliveryInstructions, setDeliveryInstructions] = useState(user?.deliveryInstructions || '');
  const [usesProfileAddress, setUsesProfileAddress] = useState(true);
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

    // Use coordinates from LocationPicker if modified, otherwise from profile or default
    const coordinates = {
      lat: deliveryLatitude || user?.deliveryLatitude || 5.3364,
      lng: deliveryLongitude || user?.deliveryLongitude || -4.0267
    };

    const result = await placeOrder(
      cart,
      deliveryAddress,
      coordinates,
      paymentMethod,
      commissionSettings,
      deliveryZone,
      deliveryInstructions,
      usesProfileAddress
    );

    if (result.success) {
      clearCart();
      alert('Commande créée avec succès!\n\nVotre commande a été transmise aux fournisseurs de votre zone.\nVous recevrez une notification dès qu\'un fournisseur proposera une offre.');
      setTimeout(() => {
        setIsProcessing(false);
        onConfirm();
      }, 500);
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
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Finaliser la commande</h1>
        <p className="text-sm sm:text-base text-gray-600">Vérifiez les détails et confirmez votre commande</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Delivery Zone */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
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
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
              Adresse de livraison
            </h3>
            
            {/* Checkbox to modify address */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="modifyAddress"
                checked={!usesProfileAddress}
                onChange={(e) => setUsesProfileAddress(!e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="modifyAddress" className="text-sm text-gray-700 cursor-pointer">
                Modifier l'adresse de livraison pour cette commande
              </label>
            </div>

            {usesProfileAddress ? (
              // Read-only mode - show profile address
              <LocationPicker
                initialLatitude={user?.deliveryLatitude}
                initialLongitude={user?.deliveryLongitude}
                initialAddress={user?.address}
                readOnly={true}
                height="200px"
              />
            ) : (
              // Edit mode - interactive map
              <LocationPicker
                initialLatitude={user?.deliveryLatitude}
                initialLongitude={user?.deliveryLongitude}
                initialAddress={user?.address}
                initialInstructions={user?.deliveryInstructions || ''}
                onLocationChange={(location) => {
                  setDeliveryAddress(location.address);
                  setDeliveryLatitude(location.latitude);
                  setDeliveryLongitude(location.longitude);
                  setDeliveryInstructions(location.instructions);
                }}
                showSearchBar={true}
                showGpsButton={true}
                showInstructions={true}
              />
            )}
          </div>

          {/* Crate Return Information */}
          {totalCratesToReturn > 0 && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Archive className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Casiers vides à rendre (interchangeables par type)
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
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

          {/* Payment Method section removed - premature at this stage */}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Récapitulatif</h3>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between text-sm sm:text-base text-gray-600">
                <span>Sous-total produits</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {consigneTotal > 0 && (
                <div className="flex justify-between text-sm sm:text-base text-orange-600">
                  <span>Total consignes</span>
                  <span className="font-medium">{formatPrice(consigneTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Frais RAVITO ({commissionSettings.clientCommission}%)</span>
                <span>{formatPrice(clientCommission)}</span>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400 -mt-1">
                Frais de traitement de la plateforme
              </div>
              <div className="border-t border-gray-200 pt-2 sm:pt-3">
                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleConfirmOrder}
                disabled={!deliveryZone || !deliveryAddress.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 sm:py-3.5 min-h-[48px] rounded-lg text-sm sm:text-base font-semibold active:from-orange-600 active:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Traitement...' : 'Confirmer la commande'}
              </button>

              <button
                onClick={onBack}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 sm:py-3.5 min-h-[48px] rounded-lg text-sm sm:text-base font-semibold active:bg-gray-50 transition-colors"
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