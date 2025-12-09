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

  const getCrateTypeDescription = (crateType: CrateType) => {
    const descriptions = {
      C24: '24 bouteilles de 33cl',
      C12: '12 bouteilles de 66cl', 
      C12V: '12 bouteilles de 75cl',
      C6: '6 bouteilles de 1.5L'
    };
    return descriptions[crateType];
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Mon Panier</h1>
        <p className="text-gray-600">Vérifiez vos articles et options de consigne</p>
      </div>

      <Card variant="elevated">
        <div className="divide-y divide-gray-200">
          {cart.map((item) => (
            <div key={item.product.id} className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.description}</p>
                      <Badge 
                        variant="default" 
                        size="sm" 
                        className="mt-1"
                      >
                        {item.product.brand} - {item.product.crateType}
                      </Badge>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartItem(item.product.id, Math.max(1, item.quantity - 1))}
                          className="h-11 w-11 lg:h-8 lg:w-8 min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                          className="h-11 w-11 lg:h-8 lg:w-8 min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors"
                        >
                          +
                        </button>
                      </div>

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

                  {item.withConsigne && (
                    <div className="mt-3 flex items-center space-x-2 text-xs bg-orange-50 text-orange-700 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Consigne incluse - Pas de casiers vides à rendre</span>
                    </div>
                  )}
                  
                  {!item.withConsigne && (
                    <div className="mt-3 flex items-center space-x-2 text-xs bg-blue-50 text-blue-700 p-2 rounded">
                      <Archive className="h-4 w-4" />
                      <span>Casiers vides à rendre : {item.quantity} casier(s) {item.product.crateType} (interchangeables)</span>
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
              <span>Frais DISTRI-NIGHT</span>
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

          <button
            onClick={onCheckout}
            className="w-full"
          >
            <Button variant="primary" size="lg" fullWidth>
              Confirmer la commande
            </Button>
          </button>
        </div>
      </Card>
    </div>
  );
};