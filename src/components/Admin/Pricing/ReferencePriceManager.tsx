/**
 * ReferencePriceManager - Interface de gestion des prix de référence
 * Permet de créer, modifier et supprimer les prix de référence
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { Card } from '../../ui/Card';
import { usePricing } from '../../../context/PricingContext';
import { useReferencePriceManagement, usePriceFormatter } from '../../../hooks/usePricing';
import { getProducts } from '../../../services/productService';
import { Product } from '../../../types';
import { CreateReferencePriceInput, UpdateReferencePriceInput } from '../../../services/pricing/referencePriceService';

export const ReferencePriceManager: React.FC = () => {
  const { referencePrices, isLoadingReferencePrices, refreshReferencePrices } = usePricing();
  const { create, update, remove, isLoading: isSaving, error } = useReferencePriceManagement();
  const { formatPrice } = usePriceFormatter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    productId: string;
    referenceUnitPrice: number;
    referenceCratePrice: number;
    referenceConsignPrice: number;
  }>({
    productId: '',
    referenceUnitPrice: 0,
    referenceCratePrice: 0,
    referenceConsignPrice: 0,
  });

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, []);

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

  // Filtrer les prix de référence
  const filteredPrices = referencePrices.filter((price) => {
    if (!searchTerm) return true;
    const product = products.find((p) => p.id === price.productId);
    return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreate = async () => {
    if (!formData.productId) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    const input: CreateReferencePriceInput = {
      productId: formData.productId,
      referenceUnitPrice: formData.referenceUnitPrice,
      referenceCratePrice: formData.referenceCratePrice,
      referenceConsignPrice: formData.referenceConsignPrice,
    };

    const result = await create(input);
    if (result) {
      setShowCreateForm(false);
      resetForm();
      await refreshReferencePrices();
    }
  };

  const handleUpdate = async (id: string) => {
    const input: UpdateReferencePriceInput = {
      referenceUnitPrice: formData.referenceUnitPrice,
      referenceCratePrice: formData.referenceCratePrice,
      referenceConsignPrice: formData.referenceConsignPrice,
    };

    const result = await update(id, input);
    if (result) {
      setEditingId(null);
      resetForm();
      await refreshReferencePrices();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce prix de référence ?')) {
      return;
    }

    const success = await remove(id);
    if (success) {
      await refreshReferencePrices();
    }
  };

  const startEdit = (price: any) => {
    setEditingId(price.id);
    setFormData({
      productId: price.productId,
      referenceUnitPrice: price.referenceUnitPrice,
      referenceCratePrice: price.referenceCratePrice,
      referenceConsignPrice: price.referenceConsignPrice,
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
      referenceUnitPrice: 0,
      referenceCratePrice: 0,
      referenceConsignPrice: 0,
    });
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Produit inconnu';
  };

  return (
    <div className="space-y-6">
      {/* Search and Create */}
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
            Créer un nouveau prix de référence
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
                value={formData.referenceUnitPrice}
                onChange={(e) => setFormData({ ...formData, referenceUnitPrice: Number(e.target.value) })}
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
                value={formData.referenceCratePrice}
                onChange={(e) => setFormData({ ...formData, referenceCratePrice: Number(e.target.value) })}
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
                value={formData.referenceConsignPrice}
                onChange={(e) => setFormData({ ...formData, referenceConsignPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                min="0"
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

      {/* Prices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prix Unitaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prix Casier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Consigne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoadingReferencePrices ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun prix de référence trouvé
                  </td>
                </tr>
              ) : (
                filteredPrices.map((price) => (
                  <tr key={price.id}>
                    {editingId === price.id ? (
                      <>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getProductName(price.productId)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={formData.referenceUnitPrice}
                            onChange={(e) =>
                              setFormData({ ...formData, referenceUnitPrice: Number(e.target.value) })
                            }
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={formData.referenceCratePrice}
                            onChange={(e) =>
                              setFormData({ ...formData, referenceCratePrice: Number(e.target.value) })
                            }
                            className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={formData.referenceConsignPrice}
                            onChange={(e) =>
                              setFormData({ ...formData, referenceConsignPrice: Number(e.target.value) })
                            }
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdate(price.id)}
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
                            {getProductName(price.productId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatPrice(price.referenceUnitPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatPrice(price.referenceCratePrice)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatPrice(price.referenceConsignPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(price)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(price.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
