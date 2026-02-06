/**
 * PriceGridTable - Refactored: Progressive product addition
 * Only displays products that have been added to supplier_price_grids
 * Allows adding products one by one with search functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X, Search, RefreshCw, CheckCircle, Plus, ChevronDown, ChevronUp, Trash2, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../ui/Card';
import { usePricing } from '../../../context/PricingContext';
import { useSupplierPriceGridManagement, usePriceFormatter, usePriceComparison } from '../../../hooks/usePricing';
import { getProducts } from '../../../services/productService';
import { searchProductsForSupplier } from '../../../services/pricing/supplierPriceService';
import { Product } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ResetQuantitiesModal } from './ResetQuantitiesModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { BulkImportExport } from './BulkImportExport';

interface ProductWithPricing extends Product {
  supplierPrice?: number;
  initialStock?: number;
  soldQuantity?: number;
  stockFinal?: number;
  gridId?: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  reference: string;
  brand: string;
  category: string;
  crate_type: string;
  crate_price: number;
  image_url: string;
}

const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'biere', label: '🍺 Bières' },
  { value: 'soda', label: '🥤 Sodas' },
  { value: 'vin', label: '🍷 Vins' },
  { value: 'eau', label: '💧 Eaux' },
  { value: 'spiritueux', label: '🥃 Spiritueux' },
];

export const PriceGridTable: React.FC = () => {
  const { user } = useAuth();
  const { supplierPriceGrids, refreshSupplierGrids, getReferencePrice } = usePricing();
  const { update, isLoading: isSaving, error } = useSupplierPriceGridManagement();
  const { formatPrice } = usePriceFormatter();
  const { compareToReference, getPriceStatus, getPriceStatusColor } = usePriceComparison();

  // Products already configured (from supplier_price_grids)
  const [configuredProducts, setConfiguredProducts] = useState<ProductWithPricing[]>([]);
  const [referencePrices, setReferencePrices] = useState<Map<string, number>>(new Map());
  const [isLoadingConfigured, setIsLoadingConfigured] = useState(false);
  
  // Search state for adding new products
  const [showAddSection, setShowAddSection] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  
  // Form state for adding products
  const [productForms, setProductForms] = useState<Record<string, { supplierPrice: string; initialStock: string }>>({});
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    supplierPrice: number;
    initialStock: number;
  }>({
    supplierPrice: 0,
    initialStock: 0,
  });

  // UI state
  const [showResetModal, setShowResetModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ productId: string; gridId: string; productName: string } | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  // Memoize excludeIds to prevent unnecessary recalculations
  const excludeIds = useMemo(() => configuredProducts.map(p => p.id), [configuredProducts]);

  // Load configured products on mount and when grids change
  useEffect(() => {
    loadConfiguredProducts();
  }, [supplierPriceGrids]);

  // Search products with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setSearching(true);
        const { data, error } = await searchProductsForSupplier(
          searchQuery,
          selectedCategory === 'all' ? undefined : selectedCategory,
          excludeIds
        );
        
        if (!error && data) {
          setSearchResults(data);
        }
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, excludeIds]);

  const loadConfiguredProducts = async () => {
    try {
      setIsLoadingConfigured(true);
      
      // Get only products that are in supplier_price_grids
      const activeGrids = supplierPriceGrids.filter(g => g.isActive);
      const productIds = activeGrids.map(g => g.productId);
      
      if (productIds.length === 0) {
        setConfiguredProducts([]);
        setIsLoadingConfigured(false);
        return;
      }

      // Fetch product details for these IDs
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Merge with grid data and load reference prices
      const priceMap = new Map<string, number>();
      const mergedProducts: ProductWithPricing[] = [];

      for (const product of productsData || []) {
        const grid = activeGrids.find(g => g.productId === product.id);
        
        if (grid) {
          const initialStock = grid.initialStock || 0;
          const soldQuantity = grid.soldQuantity || 0;
          const stockFinal = initialStock - soldQuantity;

          // Load reference price
          const refPrice = await getReferencePrice(product.id);
          if (refPrice) {
            priceMap.set(product.id, refPrice.referenceCratePrice);
          }

          mergedProducts.push({
            id: product.id,
            name: product.name,
            reference: product.reference,
            brand: product.brand,
            category: product.category,
            crateType: product.crate_type,
            cratePrice: product.crate_price,
            unitPrice: product.unit_price,
            consignPrice: product.consign_price,
            imageUrl: product.image_url,
            isActive: product.is_active,
            createdAt: new Date(product.created_at),
            updatedAt: new Date(product.updated_at),
            supplierPrice: grid.cratePrice,
            initialStock,
            soldQuantity,
            stockFinal,
            gridId: grid.id,
          });
        }
      }

      setReferencePrices(priceMap);
      setConfiguredProducts(mergedProducts);
    } catch (error) {
      console.error('Error loading configured products:', error);
      setErrorMessage('Erreur lors du chargement des produits');
    } finally {
      setIsLoadingConfigured(false);
    }
  };

  const handleAddProduct = async (product: CatalogProduct) => {
    const form = productForms[product.id];
    if (!form || !form.supplierPrice) {
      setErrorMessage('Veuillez saisir le prix fournisseur');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const supplierPrice = parseFloat(form.supplierPrice);
    if (isNaN(supplierPrice) || supplierPrice <= 0) {
      setErrorMessage('Le prix fournisseur doit être un nombre valide supérieur à 0');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const initialStock = form.initialStock ? parseInt(form.initialStock) : 0;
    if (isNaN(initialStock) || initialStock < 0) {
      setErrorMessage('Le stock initial doit être un nombre valide supérieur ou égal à 0');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setAddingProductId(product.id);
      
      const { error } = await supabase
        .from('supplier_price_grids')
        .insert({
          supplier_id: user?.id,
          product_id: product.id,
          unit_price: 0,
          crate_price: supplierPrice,
          consign_price: 0,
          initial_stock: initialStock,
          sold_quantity: 0,
          is_active: true,
        });

      if (error) throw error;

      setSuccessMessage('Produit ajouté avec succès');
      setSearchQuery('');
      setSearchResults([]);
      setProductForms({});
      await refreshSupplierGrids();
    } catch (error) {
      console.error('Error adding product:', error);
      setErrorMessage('Erreur lors de l\'ajout du produit');
    } finally {
      setAddingProductId(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
    }
  };

  const handleUpdate = async (productId: string, gridId: string) => {
    try {
      // Update the grid
      await update(gridId, {
        cratePrice: formData.supplierPrice,
      });

      // Update initial stock separately
      await supabase
        .from('supplier_price_grids')
        .update({ initial_stock: formData.initialStock })
        .eq('id', gridId);

      setEditingId(null);
      await refreshSupplierGrids();
      setSuccessMessage('Produit mis à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating grid:', error);
      setErrorMessage('Erreur lors de la mise à jour');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDelete = async (productId: string, gridId: string, productName: string) => {
    // Set modal state to show confirmation dialog
    setDeleteModal({ productId, gridId, productName });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      const { error } = await supabase
        .from('supplier_price_grids')
        .delete()
        .eq('id', deleteModal.gridId);

      if (error) throw error;

      setSuccessMessage('Produit supprimé avec succès');
      await refreshSupplierGrids();
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Erreur lors de la suppression du produit');
    } finally {
      setDeleteModal(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const startEdit = (product: ProductWithPricing) => {
    setEditingId(product.id);
    setFormData({
      supplierPrice: product.supplierPrice || 0,
      initialStock: product.initialStock || 0,
    });
  };

  const getVarianceInfo = (supplierPrice: number | undefined, productId: string) => {
    const refPrice = referencePrices.get(productId);
    if (supplierPrice === undefined || refPrice === undefined || refPrice === 0) {
      return null;
    }
    const variance = supplierPrice - refPrice;
    const variancePercentage = ((variance / refPrice) * 100).toFixed(1);
    const isAbove = variance > 0;
    const colorClass = isAbove ? 'text-red-500' : 'text-green-500';
    return { variancePercentage, isAbove, colorClass };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Grille Tarifaire</h1>

      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Succès!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      {/* Add Product Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowAddSection(!showAddSection)}
          className="w-full flex items-center justify-between p-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span className="text-lg font-semibold">Ajouter un produit</span>
          </div>
          {showAddSection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showAddSection && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit par nom ou référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-orange-500 focus:border-orange-500"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {searching && <p className="text-center text-gray-500 dark:text-gray-400">Recherche en cours...</p>}

            {searchResults.length > 0 && (
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-full object-cover mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="number"
                        placeholder="Prix Fournisseur (FCFA)"
                        value={productForms[product.id]?.supplierPrice || ''}
                        onChange={(e) => setProductForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], supplierPrice: e.target.value } }))}
                        className="w-full sm:w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Stock Initial"
                        value={productForms[product.id]?.initialStock || ''}
                        onChange={(e) => setProductForms(prev => ({ ...prev, [product.id]: { ...prev[product.id], initialStock: e.target.value } }))}
                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleAddProduct(product)}
                        disabled={addingProductId === product.id}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {addingProductId === product.id ? 'Ajout...' : <><Plus className="h-4 w-4" /> Ajouter</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Import/Export Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowImportExport(!showImportExport)}
          className="w-full flex items-center justify-between p-4 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-lg font-semibold">Import/Export en masse</span>
          </div>
          {showImportExport ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {showImportExport && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <BulkImportExport />
          </div>
        )}
      </div>

      {/* Configured Products Table/Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Table view for larger screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix Référence</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Votre Prix</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Initial</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Final</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {configuredProducts.map((product) => {
                const varianceInfo = getVarianceInfo(product.supplierPrice, product.id);
                const isEditingThis = editingId === product.id;

                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={product.imageUrl} alt={product.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatPrice(referencePrices.get(product.id) || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditingThis ? (
                        <input
                          type="number"
                          value={formData.supplierPrice}
                          onChange={(e) => setFormData({ ...formData, supplierPrice: parseFloat(e.target.value) })}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          {formatPrice(product.supplierPrice || 0)}
                          {varianceInfo && (
                            <span className={`text-xs font-semibold ${varianceInfo.colorClass}`}>
                              ({varianceInfo.isAbove ? '+' : '−'}{varianceInfo.variancePercentage}%)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditingThis ? (
                        <input
                          type="number"
                          value={formData.initialStock}
                          onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">{product.initialStock}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product.soldQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product.stockFinal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditingThis ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(product.id, product.gridId!)}
                            disabled={isSaving}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.gridId!, product.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card view for small screens */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {configuredProducts.map((product) => {
            const varianceInfo = getVarianceInfo(product.supplierPrice, product.id);
            const isEditingThis = editingId === product.id;

            return (
              <div key={product.id} className="p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <img className="h-12 w-12 rounded-full object-cover" src={product.imageUrl} alt={product.name} />
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingThis ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdate(product.id, product.gridId!)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(product)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.gridId!, product.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Prix Référence:</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(referencePrices.get(product.id) || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Votre Prix:</p>
                    {isEditingThis ? (
                      <input
                        type="number"
                        value={formData.supplierPrice}
                        onChange={(e) => setFormData({ ...formData, supplierPrice: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        {formatPrice(product.supplierPrice || 0)}
                        {varianceInfo && (
                          <span className={`text-xs font-semibold ${varianceInfo.colorClass}`}>
                            ({varianceInfo.isAbove ? '+' : '−'}{varianceInfo.variancePercentage}%)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Stock Initial:</p>
                    {isEditingThis ? (
                      <input
                        type="number"
                        value={formData.initialStock}
                        onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">{product.initialStock}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Vendu:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{product.soldQuantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Stock Final:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{product.stockFinal}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ResetQuantitiesModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={async () => {
          try {
            await supabase.rpc('reset_supplier_stock', { p_supplier_id: user?.id });
            setSuccessMessage('Quantités réinitialisées avec succès');
            await refreshSupplierGrids();
          } catch (err) {
            console.error('Error resetting quantities:', err);
            setErrorMessage('Erreur lors de la réinitialisation des quantités');
          } finally {
            setShowResetModal(false);
            setTimeout(() => {
              setSuccessMessage(null);
              setErrorMessage(null);
            }, 3000);
          }
        }}
      />

      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={confirmDelete}
          productName={deleteModal.productName}
        />
      )}
    </div>
  );
};
