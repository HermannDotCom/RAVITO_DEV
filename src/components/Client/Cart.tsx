import React from 'react';
import { Trash2, Package, AlertCircle, Archive, ShoppingCart } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useCart } from '../../context/CartContext';
import { useCommission } from '../../context/CommissionContext';
import { CrateType } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

interface CartProps {
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const { getAccessRestrictions } = useProfileSecurity();
  const { cart, removeFromCart, updateCartItem, getCartTotal } = useCart();
  const { getCartTotalWithCommission, commissionSettings } = useCommission();

  const accessRestrictions = getAccessRestrictions();

  // Restriction d'accès sécurisée
  if (!accessRestrictions.canAccessCart) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Panier non accessible</h2>
          <p className="text-red-800">
            {accessRestrictions.restrictionReason}
          </p>
        </div>
      </div>
    );
  }
  const { subtotal, consigneTotal } = getCartTotal();
  const { clientCommission, total } = getCartTotalWithCommission(cart, subtotal, consigneTotal);

  // Calculate crate summary - EXCLUDING CARTON types (disposable)
  const getCrateSummary = () => {
    const crateSummary: { [key in 'B33' | 'B65' | 'B100' | 'B50V' | 'B100V']: number } = {
      B33: 0,
      B65: 0,
      B100: 0,
      B50V: 0,
      B100V: 0
    };

    cart.forEach(item => {
      const crateType = item.product.crateType;
      // Only count consignable types (B33, B65, B100, B50V, B100V) without consigne as "to return"
      const isConsignable = item.product.consignPrice > 0 && 
                            !crateType.startsWith('CARTON') && 
                            !crateType.startsWith('PACK') &&
                            crateType !== 'C6' && 
                            crateType !== 'C20';
      
      if (!item.withConsigne && isConsignable && crateType in crateSummary) {
        crateSummary[crateType as keyof typeof crateSummary] += item.quantity;
      }
    });

    return crateSummary;
  };

  const crateSummary = getCrateSummary();
  const totalCratesToReturn = Object.values(crateSummary).reduce((sum, count) => sum + count, 0);

  const getCrateTypeDescription = (crateType: string) => {
    const descriptions: Record<string, string> = {
      B33: '24 bouteilles de 33cl',
      B65: '12 bouteilles de 65cl',
      B100: 'Bock 100cl',
      B50V: 'Vin 50cl',
      B100V: 'Vin 100cl',
    };
    return descriptions[crateType] || crateType;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Votre panier est vide"
          description="Ajoutez des produits depuis le catalogue pour commencer"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-gray-900 mb-1 sm:mb-2">Mon Panier</h1>
        <p className="text-sm sm:text-base text-gray-600">Vérifiez vos articles et options de consigne</p>
      </div>

      <Card variant="elevated">
        <div className="divide-y divide-gray-200">
          {cart.map((item) => (
            <div key={item.product.id} className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.product.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          variant="default"
                          size="sm"
                        >
                          {item.product.brand} - {item.product.crateType}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {formatPrice(item.product.pricePerUnit)}/caisse
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 min-h-[44px] min-w-[44px] text-red-500 active:text-red-700 active:bg-red-50 rounded-full transition-colors flex-shrink-0"
                      aria-label="Retirer du panier"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-3">
                    <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartItem(item.product.id, Math.max(1, item.quantity - 1))}
                          className="h-11 w-11 min-h-[48px] min-w-[48px] rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors text-lg font-semibold"
                          aria-label="Diminuer la quantité"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-base sm:text-lg font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                          className="h-11 w-11 min-h-[48px] min-w-[48px] rounded-lg bg-orange-100 flex items-center justify-center active:bg-orange-200 transition-colors text-lg font-semibold"
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>

                      {/* Only show consigne option for consignable products (not CARTONs) */}
                      {item.product.consignPrice > 0 && !item.product.crateType.startsWith('CARTON') && (
                        <div className="flex items-center">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.withConsigne}
                              onChange={(e) => updateCartItem(item.product.id, item.quantity, e.target.checked)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Avec consigne</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.product.pricePerUnit * item.quantity)}
                      </p>
                      {item.withConsigne && (
                        <p className="text-sm text-orange-600">
                          + {formatPrice(item.product.consigneAmount * item.quantity)} consigne
                        </p>
                      )}
                    </div>
                  </div>

                  {item.withConsigne && item.product.consignPrice > 0 && !item.product.crateType.startsWith('CARTON') && (
                    <div className="mt-3 flex items-center space-x-2 text-xs bg-orange-50 text-orange-700 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Consigne incluse - Pas de casiers vides à rendre</span>
                    </div>
                  )}
                  
                  {!item.withConsigne && item.product.consignPrice > 0 && !item.product.crateType.startsWith('CARTON') && (
                    <div className="mt-3 flex items-center space-x-2 text-xs bg-blue-50 text-blue-700 p-2 rounded">
                      <Archive className="h-4 w-4" />
                      <span>Casiers vides à rendre : {item.quantity} casier(s) {item.product.crateType} (interchangeables)</span>
                    </div>
                  )}
                  
                  {item.product.crateType.startsWith('CARTON') && (
                    <div className="mt-3 flex items-center space-x-2 text-xs bg-gray-50 text-gray-600 p-2 rounded">
                      <Package className="h-4 w-4" />
                      <span>Emballage jetable - Pas de consigne ni de casiers à rendre</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
          {/* Crate Return Summary */}
          {totalCratesToReturn > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Archive className="h-4 w-4 mr-2" />
                Casiers vides à rendre (interchangeables par type)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {Object.entries(crateSummary).map(([crateType, count]) => (
                  count > 0 && (
                    <div key={crateType} className="bg-white rounded p-2 text-center">
                      <div className="font-bold text-blue-700">{count}</div>
                      <div className="text-blue-600 text-xs">{crateType}</div>
                      <div className="text-blue-500 text-xs">{getCrateTypeDescription(crateType as CrateType)}</div>
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-3 bg-white rounded p-2">
                ⚠️ <strong>Important :</strong> Vous devez rendre {totalCratesToReturn} casier(s) vide(s) au livreur.<br/>
                💡 <strong>Les casiers sont interchangeables par type</strong> - Peu importe la marque d'origine.
              </p>
            </div>
          )}

          {/* Price Summary */}
          <div className="space-y-2">
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
              <span>Frais RAVITO</span>
              <span>{formatPrice(clientCommission)}</span>
            </div>
            <div className="text-xs text-blue-500 -mt-1 text-right">
              ({commissionSettings.clientCommission}% frais de traitement)
            </div>
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Information paiement</p>
                <p>Le paiement sera effectué uniquement après acceptation de votre commande par un fournisseur disponible.</p>
              </div>
            </div>
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={onCheckout}>
            Confirmer la commande
          </Button>
        </div>
      </Card>
    </div>
  );
};