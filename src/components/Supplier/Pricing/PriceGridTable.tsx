/**
 * PriceGridTable - Tableau de gestion des produits vendus
 * Affiche TOUS les produits avec la possibilité de saisir les prix et stocks
 */

import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Search, Download, Upload, RefreshCw, CheckCircle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { usePricing } from '../../../context/PricingContext';
import { useSupplierPriceGridManagement, usePriceFormatter, usePriceComparison } from '../../../hooks/usePricing';
import { getProducts } from '../../../services/productService';
import { Product } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { BulkImportExport } from './BulkImportExport';
import { ResetQuantitiesModal } from './ResetQuantitiesModal';

interface ProductWithPricing extends Product {
  supplierPrice?: number;
  initialStock?: number;
  soldQuantity?: number;
  stockFinal?: number;
  gridId?: string;
}

export const PriceGridTable: React.FC = () => {
  const { user } = useAuth();
  const { supplierPriceGrids, refreshSupplierGrids, getReferencePrice } = usePricing();
  const { update, isLoading: isSaving, error } = useSupplierPriceGridManagement();
  const { formatPrice } = usePriceFormatter();
  const { compareToReference, getPriceStatus, getPriceStatusColor } = usePriceComparison();

  const [products, setProducts] = useState<ProductWithPricing[]>([]);
  const [referencePrices, setReferencePrices] = useState<Map<string, number>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    supplierPrice: number;
    initialStock: number;
  }>({
    supplierPrice: 0,
    initialStock: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    mergeProductsWithGrids();
  }, [products, supplierPriceGrids]);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const fetchedProducts = await getProducts({ isActive: true });
      
      // Charger les prix de référence
      const priceMap = new Map<string, number>();
      for (const product of fetchedProducts) {
        const refPrice = await getReferencePrice(product.id);
        if (refPrice) {
          priceMap.set(product.id, refPrice.referenceCratePrice);
        }
      }
      setReferencePrices(priceMap);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const mergeProductsWithGrids = () => {
    const mergedProducts: ProductWithPricing[] = products.map(product => {
      const grid = supplierPriceGrids.find(g => g.productId === product.id && g.isActive);
      
      if (grid) {
        const initialStock = grid.initialStock || 0;
        const soldQuantity = grid.soldQuantity || 0;
        const stockFinal = initialStock - soldQuantity;

        return {
          ...product,
          supplierPrice: grid.cratePrice,
          initialStock,
          soldQuantity,
          stockFinal,
          gridId: grid.id,
        };
      }

      return {
        ...product,
        supplierPrice: undefined,
        initialStock: 0,
        soldQuantity: 0,
        stockFinal: 0,
        gridId: undefined,
      };
    });

    setProducts(mergedProducts);
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleUpdate = async (productId: string, gridId?: string) => {
    try {
      if (!gridId) {
        // Créer une nouvelle grille si elle n'existe pas
        const { data: newGrid, error: createError } = await supabase
          .from('supplier_price_grids')
          .insert({
            supplier_id: user?.id,
            product_id: productId,
            unit_price: 0,
            crate_price: formData.supplierPrice,
            consign_price: 0,
            initial_stock: formData.initialStock,
            sold_quantity: 0,
            is_active: true,
          })
          .select()
          .single();

        if (createError) throw createError;
      } else {
        // Mettre à jour la grille existante
        const updateResult = await update(gridId, {
          cratePrice: formData.supplierPrice,
          // Note: On ne met à jour que le prix et le stock initial via cette interface
          // Le sold_quantity est géré automatiquement par le trigger
        });

        // Mettre à jour le stock initial séparément
        await supabase
          .from('supplier_price_grids')
          .update({ initial_stock: formData.initialStock })
          .eq('id', gridId);
      }

      setEditingId(null);
      await refreshSupplierGrids();
      await loadProducts();
    } catch (error) {
      console.error('Error updating grid:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const startEdit = (product: ProductWithPricing) => {
    setEditingId(product.id);
    setFormData({
      supplierPrice: product.supplierPrice || 0,
      initialStock: product.initialStock || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      supplierPrice: 0,
      initialStock: 0,
    });
  };

  const getVarianceInfo = (supplierPrice?: number, productId?: string) => {
    if (!supplierPrice || !productId) return null;
    
    const refPrice = referencePrices.get(productId);
    if (!refPrice) return null;

    const { variancePercentage, isAbove, isBelow } = compareToReference(supplierPrice, refPrice);
    const status = getPriceStatus(variancePercentage);
    const colorClass = getPriceStatusColor(status);

    return {
      variancePercentage,
      isAbove,
      isBelow,
      status,
      colorClass,
    };
  };

  const handleResetQuantities = async () => {
    try {
      if (!user) return;

      // Appeler la fonction de base de données pour réinitialiser
      const { error } = await supabase.rpc('reset_supplier_sold_quantities', {
        p_supplier_id: user.id,
      });

      if (error) throw error;

      // Rafraîchir les données
      await refreshSupplierGrids();
      await loadProducts();
      
      setSuccessMessage('Les quantités vendues ont été réinitialisées avec succès');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error resetting quantities:', error);
      throw error;
    }
  };

  // Obtenir le nom du fournisseur pour l'affichage dynamique
  const supplierName = user?.businessName || user?.name || 'Fournisseur';

  return (
    <>
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Réinitialiser les quantités vendues
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import/Export
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix {supplierName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Écart %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Initial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qté Vendue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingProducts ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Chargement des produits...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? 'Aucun produit trouvé pour cette recherche'
                        : 'Aucun produit disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const varianceInfo = getVarianceInfo(product.supplierPrice, product.id);
                    const isEditing = editingId === product.id;
                    const refPrice = referencePrices.get(product.id);

                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.brand} - {product.crateType}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={formData.supplierPrice}
                              onChange={(e) =>
                                setFormData({ ...formData, supplierPrice: Number(e.target.value) })
                              }
                              className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              min="0"
                              placeholder="Prix FCFA"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.supplierPrice ? formatPrice(product.supplierPrice) : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {refPrice ? formatPrice(refPrice) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {varianceInfo ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${varianceInfo.colorClass}`}>
                              {varianceInfo.isAbove ? '+' : ''}
                              {varianceInfo.variancePercentage.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={formData.initialStock}
                              onChange={(e) =>
                                setFormData({ ...formData, initialStock: Number(e.target.value) })
                              }
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              min="0"
                              placeholder="Qté"
                            />
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">
                              {product.initialStock || 0}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {product.soldQuantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${
                            (product.stockFinal || 0) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {product.stockFinal || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdate(product.id, product.gridId)}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Enregistrer"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(product)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info sur le workflow */}
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-800 dark:text-green-300">
            <p className="font-medium mb-2">💡 Cycle opérationnel quotidien :</p>
            <ol className="space-y-1 list-decimal list-inside ml-2">
              <li><strong>Ouverture</strong> : Saisissez votre stock initial et réinitialisez les quantités vendues</li>
              <li><strong>Activité</strong> : Les quantités vendues se mettent à jour automatiquement à chaque commande</li>
              <li><strong>Clôture</strong> : Vérifiez votre stock final et exportez l'inventaire si nécessaire</li>
            </ol>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showImportExport && (
        <BulkImportExport
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => {
            refreshSupplierGrids();
            loadProducts();
          }}
        />
      )}

      {showResetModal && (
        <ResetQuantitiesModal
          onClose={() => setShowResetModal(false)}
          onConfirm={handleResetQuantities}
        />
      )}
    </>
  );
};
