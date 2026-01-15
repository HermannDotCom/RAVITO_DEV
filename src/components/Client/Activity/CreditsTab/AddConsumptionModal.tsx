import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CreditCustomer, AddConsumptionData } from '../../../../types/activity';
import { EstablishmentProduct } from '../../../../types/activity';
import { getEstablishmentProducts } from '../../../../services/dailySheetService';

interface AddConsumptionModalProps {
  customer: CreditCustomer;
  organizationId: string;
  onClose: () => void;
  onSubmit: (data: AddConsumptionData) => Promise<boolean>;
}

interface ConsumptionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export const AddConsumptionModal: React.FC<AddConsumptionModalProps> = ({
  customer,
  organizationId,
  onClose,
  onSubmit,
}) => {
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<ConsumptionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<EstablishmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [organizationId]);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getEstablishmentProducts(organizationId);
    if (result.data) {
      setProducts(result.data.filter((p) => p.isActive));
    }
    setLoading(false);
  };

  const addItem = () => {
    if (products.length === 0) {
      setError('Aucun produit disponible');
      return;
    }
    const firstProduct = products[0];
    setItems([
      ...items,
      {
        productId: firstProduct.productId,
        productName: firstProduct.product?.name || '',
        quantity: 1,
        unitPrice: firstProduct.sellingPrice,
      },
    ]);
  };

  const updateItem = (index: number, updates: Partial<ConsumptionItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    
    // Update product name and price when product changes
    if (updates.productId) {
      const product = products.find((p) => p.productId === updates.productId);
      if (product) {
        newItems[index].productName = product.product?.name || '';
        newItems[index].unitPrice = product.sellingPrice;
      }
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const changeQuantity = (index: number, delta: number) => {
    const newQuantity = Math.max(1, items[index].quantity + delta);
    updateItem(index, { quantity: newQuantity });
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const newBalance = customer.currentBalance + totalAmount;
  const isOverLimit = customer.creditLimit > 0 && newBalance > customer.creditLimit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Veuillez ajouter au moins un article');
      return;
    }

    if (totalAmount <= 0) {
      setError('Le montant total doit être supérieur à 0');
      return;
    }

    setSubmitting(true);
    const success = await onSubmit({
      customerId: customer.id,
      transactionDate,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (!success) {
      setError('Erreur lors de l\'enregistrement de la consommation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ajouter une Consommation</h3>
              <p className="text-sm text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date de la consommation
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Articles
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-slate-500">Chargement des produits...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <p className="text-slate-500">Aucun article ajouté</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Cliquez sur "+ Ajouter" pour commencer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex gap-2 mb-2">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, { productId: e.target.value })}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        {products.map((product) => (
                          <option key={product.productId} value={product.productId}>
                            {product.product?.name || 'Produit inconnu'} - {formatCurrency(product.sellingPrice)} FCFA
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(index, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(index, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          {formatCurrency(item.unitPrice)} FCFA × {item.quantity}
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.unitPrice)} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Table 5, terrasse..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Total à créditer:</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAmount)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Solde actuel:</span>
                <span className="font-medium text-slate-900">{formatCurrency(customer.currentBalance)} FCFA</span>
              </div>
              <div className="h-px bg-orange-300"></div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Nouveau solde:</span>
                <span className={`font-bold text-lg ${isOverLimit ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatCurrency(newBalance)} FCFA
                </span>
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-1 text-xs text-red-700 mt-1">
                  <span>⚠️ Plafond de crédit dépassé ({formatCurrency(customer.creditLimit)} FCFA)</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer le crédit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
