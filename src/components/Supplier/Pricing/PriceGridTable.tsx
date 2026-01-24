/**
 * PriceGridTable - Refactored: Progressive product addition
 * Only displays products that have been added to supplier_price_grids
 * Allows adding products one by one with search functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X, Search, RefreshCw, CheckCircle, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
      setErrorMessage('Erreur lors de la suppression');
    } finally {
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
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

      const { error } = await supabase.rpc('reset_supplier_sold_quantities', {
        p_supplier_id: user.id,
      });

      if (error) throw error;

      await refreshSupplierGrids();
      setSuccessMessage('Les quantités vendues ont été réinitialisées avec succès');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error resetting quantities:', error);
      throw error;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const supplierName = user?.businessName || user?.name || 'Fournisseur';

  return (
    <>
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produits vendus</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestion quotidienne de vos stocks et de vos prix
            </p>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Réinitialiser quantités
          </button>
        </div>

        {/* Error Display */}
        {(error || errorMessage) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">{error || errorMessage}</p>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Add Product Section */}
        <div className="bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className="w-full flex items-center justify-between p-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Ajouter un produit</span>
            </div>
            {showAddSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showAddSection && (
            <div className="p-4 space-y-4">
              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Rechercher un produit (min. 3 car.)..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Search results */}
              {searching && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                  Recherche en cours...
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Résultats de recherche :
                  </p>
                  {searchResults.map(product => {
                    const form = productForms[product.id] || { supplierPrice: '', initialStock: '0' };

                    return (
                      <div key={product.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {product.brand} • {product.crate_type}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Réf: {formatCurrency(product.crate_price)} F/casier
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                Prix fournisseur<span className="text-red-500">*</span>:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={form.supplierPrice}
                                onChange={(e) => setProductForms({
                                  ...productForms,
                                  [product.id]: { ...form, supplierPrice: e.target.value }
                                })}
                                placeholder="0"
                                className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">F</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                Stock initial:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={form.initialStock}
                                onChange={(e) => setProductForms({
                                  ...productForms,
                                  [product.id]: { ...form, initialStock: e.target.value }
                                })}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          disabled={addingProductId === product.id}
                          className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" />
                          {addingProductId === product.id ? 'Ajout...' : 'Ajouter'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                  Aucun produit trouvé
                </div>
              )}

              {searchQuery.length < 3 && (
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
                  Saisissez au moins 3 caractères pour rechercher
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configured Products Table */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              📦 Mes produits ({configuredProducts.length})
            </h2>
          </div>

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
                {isLoadingConfigured ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Chargement des produits...
                    </td>
                  </tr>
                ) : configuredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400 dark:text-gray-500">
                        <p className="font-medium text-lg mb-2">Aucun produit configuré</p>
                        <p className="text-sm">Utilisez la recherche ci-dessus pour ajouter des produits</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  configuredProducts.map((product) => {
                    const varianceInfo = getVarianceInfo(product.supplierPrice, product.id);
                    const isEditing = editingId === product.id;
                    const refPrice = referencePrices.get(product.id);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                                onClick={() => {
                                  if (product.gridId) {
                                    handleUpdate(product.id, product.gridId);
                                  }
                                }}
                                disabled={isSaving || !product.gridId}
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(product)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (product.gridId) {
                                    handleDelete(product.id, product.gridId, product.name);
                                  }
                                }}
                                disabled={!product.gridId}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 disabled:opacity-50"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
      {showResetModal && (
        <ResetQuantitiesModal
          onClose={() => setShowResetModal(false)}
          onConfirm={handleResetQuantities}
        />
      )}

      {deleteModal && (
        <DeleteConfirmationModal
          productName={deleteModal.productName}
          onConfirm={confirmDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </>
  );
};
