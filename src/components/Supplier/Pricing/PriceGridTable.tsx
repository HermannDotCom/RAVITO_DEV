/**
 * PriceGridTable - Tableau de gestion des grilles tarifaires
 * Permet au fournisseur de créer, modifier et gérer ses prix
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, History, Download, Upload } from 'lucide-react';
import { Card } from '../../ui/Card';
import { usePricing } from '../../../context/PricingContext';
import { useSupplierPriceGridManagement, usePriceFormatter, usePriceComparison } from '../../../hooks/usePricing';
import { getProducts } from '../../../services/productService';
import { Product } from '../../../types';
import { CreateSupplierPriceGridInput, UpdateSupplierPriceGridInput } from '../../../services/pricing/supplierPriceService';
import { PriceHistoryModal } from './PriceHistoryModal';
import { BulkImportExport } from './BulkImportExport';

export const PriceGridTable: React.FC = () => {
  const { supplierPriceGrids, refreshSupplierGrids, getReferencePrice } = usePricing();
  const { create, update, remove, isLoading: isSaving, error } = useSupplierPriceGridManagement();
  const { formatPrice } = usePriceFormatter();
  const { compareToReference, getPriceStatus, getPriceStatusColor } = usePriceComparison();

  const [products, setProducts] = useState<Product[]>([]);
  const [referencePrices, setReferencePrices] = useState<Map<string, number>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  const [formData, setFormData] = useState<{
    productId: string;
    unitPrice: number;
    cratePrice: number;
    consignPrice: number;
    discountPercentage: number;
    minimumOrderQuantity: number;
    notes: string;
  }>({
    productId: '',
    unitPrice: 0,
    cratePrice: 0,
    consignPrice: 0,
    discountPercentage: 0,
    minimumOrderQuantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadReferencePrices();
  }, [products]);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const fetchedProducts = await getProducts({ isActive: true });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadReferencePrices = async () => {
    const priceMap = new Map<string, number>();
    for (const product of products) {
      const refPrice = await getReferencePrice(product.id);
      if (refPrice) {
        priceMap.set(product.id, refPrice.referenceCratePrice);
      }
    }
    setReferencePrices(priceMap);
  };

  const filteredGrids = supplierPriceGrids.filter((grid) => {
    if (!searchTerm) return true;
    const product = products.find((p) => p.id === grid.productId);
    return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreate = async () => {
    if (!formData.productId) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    const input: CreateSupplierPriceGridInput = {
      productId: formData.productId,
      unitPrice: formData.unitPrice,
      cratePrice: formData.cratePrice,
      consignPrice: formData.consignPrice,
      discountPercentage: formData.discountPercentage,
      minimumOrderQuantity: formData.minimumOrderQuantity,
      notes: formData.notes,
    };

    const result = await create(input);
    if (result) {
      setShowCreateForm(false);
      resetForm();
      await refreshSupplierGrids();
    }
  };

  const handleUpdate = async (id: string) => {
    const input: UpdateSupplierPriceGridInput = {
      unitPrice: formData.unitPrice,
      cratePrice: formData.cratePrice,
      consignPrice: formData.consignPrice,
      discountPercentage: formData.discountPercentage,
      minimumOrderQuantity: formData.minimumOrderQuantity,
      notes: formData.notes,
    };

    const result = await update(id, input);
    if (result) {
      setEditingId(null);
      resetForm();
      await refreshSupplierGrids();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette grille tarifaire ?')) {
      return;
    }

    const success = await remove(id);
    if (success) {
      await refreshSupplierGrids();
    }
  };

  const startEdit = (grid: any) => {
    setEditingId(grid.id);
    setFormData({
      productId: grid.productId,
      unitPrice: grid.unitPrice,
      cratePrice: grid.cratePrice,
      consignPrice: grid.consignPrice,
      discountPercentage: grid.discountPercentage,
      minimumOrderQuantity: grid.minimumOrderQuantity,
      notes: grid.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      unitPrice: 0,
      cratePrice: 0,
      consignPrice: 0,
      discountPercentage: 0,
      minimumOrderQuantity: 1,
      notes: '',
    });
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Produit inconnu';
  };

  const getVarianceInfo = (productId: string, cratePrice: number) => {
    const refPrice = referencePrices.get(productId);
    if (!refPrice) return null;

    const { variancePercentage, isAbove, isBelow } = compareToReference(cratePrice, refPrice);
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

  const showHistory = (gridId: string) => {
    setSelectedGridId(gridId);
    setShowHistoryModal(true);
  };

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

          <div className="flex gap-2">
            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import/Export
            </button>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nouveau Prix
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Créer une nouvelle grille tarifaire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Produit
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.brand} ({product.crateType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix Unitaire (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix Casier (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.cratePrice}
                  onChange={(e) => setFormData({ ...formData, cratePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix Consigne (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.consignPrice}
                  onChange={(e) => setFormData({ ...formData, consignPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remise (%)
                </label>
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantité Minimale
                </label>
                <input
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) => setFormData({ ...formData, minimumOrderQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="Notes ou conditions spéciales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </div>
          </Card>
        )}

        {/* Grids Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix Casier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Écart
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qté Min
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGrids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? 'Aucune grille trouvée pour cette recherche'
                        : 'Aucune grille tarifaire. Créez votre première grille pour commencer.'}
                    </td>
                  </tr>
                ) : (
                  filteredGrids.map((grid) => {
                    const varianceInfo = getVarianceInfo(grid.productId, grid.cratePrice);
                    const isEditing = editingId === grid.id;

                    return (
                      <tr key={grid.id} className={!grid.isActive ? 'opacity-50' : ''}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getProductName(grid.productId)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={formData.cratePrice}
                                onChange={(e) =>
                                  setFormData({ ...formData, cratePrice: Number(e.target.value) })
                                }
                                className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                min="0"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {referencePrices.get(grid.productId)
                                ? formatPrice(referencePrices.get(grid.productId)!)
                                : '-'}
                            </td>
                            <td className="px-6 py-4">-</td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={formData.minimumOrderQuantity}
                                onChange={(e) =>
                                  setFormData({ ...formData, minimumOrderQuantity: Number(e.target.value) })
                                }
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                min="1"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdate(grid.id)}
                                  disabled={isSaving}
                                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={isSaving}
                                  className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getProductName(grid.productId)}
                              </div>
                              {grid.notes && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {grid.notes}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(grid.cratePrice)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {referencePrices.get(grid.productId)
                                ? formatPrice(referencePrices.get(grid.productId)!)
                                : '-'}
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
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {grid.minimumOrderQuantity}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => showHistory(grid.id)}
                                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                                  title="Historique"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => startEdit(grid)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(grid.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showHistoryModal && selectedGridId && (
        <PriceHistoryModal
          gridId={selectedGridId}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedGridId(null);
          }}
        />
      )}

      {showImportExport && (
        <BulkImportExport
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => refreshSupplierGrids()}
        />
      )}
    </>
  );
};
