import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, Package } from 'lucide-react';
import { Order } from '../../types';
import { createSupplierOffer, getSupplierPrices } from '../../services/supplierOfferService';
import { useCommission } from '../../context/CommissionContext';
import { supabase } from '../../lib/supabase';

interface CreateOfferModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModifiedItem {
  productId: string;
  productName: string;
  originalQuantity: number;
  quantity: number;
  withConsigne: boolean;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  isCustomPrice?: boolean;
  referenceCratePrice?: number;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ order, onClose, onSuccess }) => {
  const { commissionSettings } = useCommission();
  const [modifiedItems, setModifiedItems] = useState<ModifiedItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSupplierPrices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to reference prices if no user
        const items: ModifiedItem[] = order.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          originalQuantity: item.quantity,
          quantity: item.quantity,
          withConsigne: item.withConsigne,
          unitPrice: item.product.unitPrice,
          cratePrice: item.product.cratePrice,
          consignPrice: item.product.consignPrice,
          isCustomPrice: false,
          referenceCratePrice: item.product.cratePrice
        }));
        setModifiedItems(items);
        return;
      }

      // Fetch supplier's custom prices
      const priceMap = await getSupplierPrices(user.id);

      // Use supplier prices with fallback to Ravito reference prices
      const items: ModifiedItem[] = order.items.map(item => {
        const supplierPrice = priceMap.get(item.product.id);
        
        return {
          productId: item.product.id,
          productName: item.product.name,
          originalQuantity: item.quantity,
          quantity: item.quantity,
          withConsigne: item.withConsigne,
          unitPrice: supplierPrice?.unit_price ?? item.product.unitPrice,
          cratePrice: supplierPrice?.crate_price ?? item.product.cratePrice,
          consignPrice: supplierPrice?.consign_price ?? item.product.consignPrice,
          isCustomPrice: !!supplierPrice,
          referenceCratePrice: item.product.cratePrice
        };
      });
      
      setModifiedItems(items);
    };

    loadSupplierPrices();
  }, [order]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setModifiedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotals = () => {
    const subtotal = modifiedItems.reduce(
      (sum, item) => sum + item.cratePrice * item.quantity,
      0
    );
    const consigneTotal = modifiedItems.reduce(
      (sum, item) => sum + (item.withConsigne ? item.consignPrice * item.quantity : 0),
      0
    );
    const orderTotal = subtotal + consigneTotal;
    const supplierCommission = Math.round(orderTotal * (commissionSettings.supplierCommission / 100));
    const netSupplierAmount = orderTotal - supplierCommission;
    const clientCommission = Math.round(orderTotal * (commissionSettings.clientCommission / 100));
    const totalAmount = orderTotal + clientCommission;

    return {
      subtotal,
      consigneTotal,
      orderTotal,
      supplierCommission,
      netSupplierAmount,
      clientCommission,
      totalAmount
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    const validItems = modifiedItems.filter(item => item.quantity > 0);

    if (validItems.length === 0) {
      setError('Vous devez avoir au moins un produit avec une quantité supérieure à 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const offerItems = validItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      withConsigne: item.withConsigne,
      unitPrice: item.unitPrice,
      cratePrice: item.cratePrice,
      consignPrice: item.consignPrice
    }));

    const result = await createSupplierOffer(
      order.id,
      offerItems,
      totals.totalAmount,
      totals.consigneTotal,
      totals.supplierCommission,
      totals.netSupplierAmount,
      message.trim() || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Erreur lors de la création de l\'offre');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Créer une offre
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {modifiedItems.some(item => !item.isCustomPrice) && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-300">
                <p className="font-semibold mb-1">Prix par défaut utilisés</p>
                <p>
                  Certains produits utilisent les prix de référence Ravito. 
                  Définissez vos propres prix dans votre grille tarifaire pour être plus compétitif.
                </p>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Vous pouvez modifier les quantités selon vos disponibilités.
              Les produits avec une quantité de 0 seront retirés de l'offre.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Produits demandés
            </h3>
            {modifiedItems.map(item => (
              <div
                key={item.productId}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Demandé: {item.originalQuantity} caisses
                      {item.withConsigne && ' (avec consigne)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Prix: {formatPrice(item.cratePrice)}
                    </p>
                    {item.isCustomPrice ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        ✓ Prix personnalisé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        ⚠ Prix par défaut
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={isSubmitting}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={isSubmitting}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(item.cratePrice * item.quantity)}
                    </p>
                    {item.quantity !== item.originalQuantity && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Modifié
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message au client (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Certains produits sont en stock limité..."
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPrice(totals.subtotal)}
              </span>
            </div>
            {totals.consigneTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Consigne</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(totals.consigneTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-600 dark:text-gray-400">Commission fournisseur ({commissionSettings.supplierCommission}%)</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatPrice(totals.supplierCommission)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Vous recevrez</span>
              <span className="text-green-600 dark:text-green-400">
                {formatPrice(totals.netSupplierAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Total client</span>
              <span>{formatPrice(totals.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !modifiedItems.some(item => item.quantity > 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Envoi...' : 'Soumettre l\'offre'}
          </button>
        </div>
      </div>
    </div>
  );
};
