/**
 * @deprecated This modal is deprecated and no longer used.
 * Product configuration has been integrated directly into StocksTab.tsx
 * as per the requirements to simplify the user experience and respect the app's design.
 * 
 * This file is kept for reference purposes only.
 * 
 * Date: 2026-01-11
 * Reason: Complete refactoring of Stocks tab to integrate product configuration inline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, X, Search, Plus, Trash2, Save } from 'lucide-react';
import { useOrganization } from '../../../hooks/useOrganization';
import {
  getAllEstablishmentProducts,
  searchCatalogProducts,
  addEstablishmentProduct,
  updateEstablishmentProduct,
  deleteEstablishmentProduct,
} from '../../../services/dailySheetService';

interface ProductConfigModalProps {
  onClose: () => void;
  onProductsUpdated?: () => void;  // Callback optionnel
}

interface ConfiguredProduct {
  id: string;
  organizationId: string;
  productId: string;
  sellingPrice: number;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    reference: string;
    brand: string;
    category: string;
    crate_type: string;  // Database returns snake_case
    crate_price: number; // Database returns snake_case
    image_url: string;   // Database returns snake_case
  };
}

interface CatalogProduct {
  id: string;
  name: string;
  reference: string;
  brand: string;
  category: string;
  crate_type: string;  // Database returns snake_case
  crate_price: number; // Database returns snake_case
  image_url: string;   // Database returns snake_case
}

const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'biere', label: '🍺 Bières' },
  { value: 'soda', label: '🥤 Sodas' },
  { value: 'vin', label: '🍷 Vins' },
  { value: 'eau', label: '💧 Eaux' },
  { value: 'spiritueux', label: '🥃 Spiritueux' },
];

// Constants for crate bottle counts and calculations
const CRATE_BOTTLE_COUNT: Record<string, number> = {
  'C24': 24,    // 24 bouteilles de 33cl
  'C12': 12,    // 12 bouteilles de 65cl
  'C12V': 12,   // 12 bouteilles de 75cl (vin)
  'C6': 6,      // 6 bouteilles de 1.5L
  'C20': 20,    // 20 bouteilles
  'CARTON24': 24,
  'CARTON6': 6,
  'PACK6': 6,
  'PACK12': 12,
};

const DEFAULT_BOTTLE_COUNT = 24; // Nombre de bouteilles par défaut si type non reconnu
const DEFAULT_MARKUP_MULTIPLIER = 1.4; // Marge de 40% par défaut

export const ProductConfigModal: React.FC<ProductConfigModalProps> = ({ onClose, onProductsUpdated }) => {
  const { organizationId } = useOrganization();
  const [configuredProducts, setConfiguredProducts] = useState<ConfiguredProduct[]>([]);
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: number }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load configured products
  const loadConfiguredProducts = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    const { data, error } = await getAllEstablishmentProducts(organizationId);
    
    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setConfiguredProducts(data || []);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadConfiguredProducts();
  }, [loadConfiguredProducts]);

  // Search products with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setSearching(true);
        const excludeIds = configuredProducts.map(p => p.productId);
        const { data, error } = await searchCatalogProducts(
          searchQuery,
          selectedCategory,
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
  }, [searchQuery, selectedCategory, configuredProducts]);

  // Add product
  const handleAddProduct = async (product: CatalogProduct) => {
    if (!organizationId) return;

    // Calculer un prix de vente suggéré (coût unitaire + marge par défaut)
    const bottleCount = getBottleCount(product.crate_type);
    const unitCost = Math.round(product.crate_price / bottleCount);
    const suggestedPrice = Math.round(unitCost * DEFAULT_MARKUP_MULTIPLIER);

    const { success, error } = await addEstablishmentProduct(
      organizationId,
      product.id,
      suggestedPrice  // Prix suggéré à la bouteille, pas au casier
    );

    if (success) {
      setMessage({ type: 'success', text: 'Produit ajouté avec succès' });
      await loadConfiguredProducts();
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de l\'ajout' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Update price with debounce
  const handlePriceChange = (productId: string, newPrice: number) => {
    setEditingPrices({ ...editingPrices, [productId]: newPrice });
  };

  const handleSavePrice = async (id: string, price: number) => {
    const { success, error } = await updateEstablishmentProduct(id, { sellingPrice: price });
    
    if (success) {
      setMessage({ type: 'success', text: 'Prix mis à jour' });
      await loadConfiguredProducts();
      const newEditingPrices = { ...editingPrices };
      delete newEditingPrices[id];
      setEditingPrices(newEditingPrices);
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de la mise à jour' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Toggle active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { success, error } = await updateEstablishmentProduct(id, { isActive: !currentStatus });
    
    if (success) {
      setMessage({ type: 'success', text: currentStatus ? 'Produit désactivé' : 'Produit activé' });
      await loadConfiguredProducts();
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de la mise à jour' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit ?')) return;

    const { success, error } = await deleteEstablishmentProduct(id);
    
    if (success) {
      setMessage({ type: 'success', text: 'Produit retiré' });
      await loadConfiguredProducts();
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de la suppression' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Handle modal close with callback
  const handleClose = () => {
    if (onProductsUpdated) {
      onProductsUpdated();
    }
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // Fonction pour obtenir le nombre de bouteilles par type de casier
  const getBottleCount = (crateType: string): number => {
    return CRATE_BOTTLE_COUNT[crateType] || DEFAULT_BOTTLE_COUNT;
  };

  // Fonction pour calculer le coût unitaire (par bouteille)
  const calculateUnitCost = (cratePrice: number, crateType: string): number => {
    const bottleCount = getBottleCount(crateType);
    return Math.round(cratePrice / bottleCount);
  };

  // Fonction pour calculer la marge (par bouteille vs coût unitaire)
  const calculateMargin = (sellingPrice: number, cratePrice: number, crateType: string) => {
    const unitCost = calculateUnitCost(cratePrice, crateType);
    const margin = sellingPrice - unitCost;
    const marginPercent = unitCost > 0 ? ((margin / unitCost) * 100).toFixed(1) : '0';
    return { unitCost, margin, marginPercent };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Configuration des Produits</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Search Section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Ajouter un produit</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit (min. 3 caractères)..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="mt-3 text-center text-slate-500 text-sm">Recherche en cours...</div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map(product => {
                  const unitCost = calculateUnitCost(product.crate_price, product.crate_type);
                  const bottleCount = getBottleCount(product.crate_type);
                  
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{product.name}</p>
                        <p className="text-xs text-slate-600">{product.brand} • {product.crate_type} ({bottleCount} bout.)</p>
                        <p className="text-xs text-slate-600">Casier: {formatCurrency(product.crate_price)} F → {formatCurrency(unitCost)} F/bout.</p>
                      </div>
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Configured Products */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Produits configurés ({configuredProducts.length})
            </h4>
            
            {loading ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : configuredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Aucun produit configuré</p>
                <p className="text-xs mt-1">Utilisez la recherche ci-dessus pour ajouter des produits</p>
              </div>
            ) : (
              <div className="space-y-2">
                {configuredProducts.map(item => {
                  const currentPrice = editingPrices[item.id] ?? item.sellingPrice;
                  const { unitCost, margin, marginPercent } = calculateMargin(currentPrice, item.product.crate_price, item.product.crate_type);
                  const hasUnsavedChanges = editingPrices[item.id] !== undefined && editingPrices[item.id] !== item.sellingPrice;
                  const bottleCount = getBottleCount(item.product.crate_type);

                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300 opacity-60'
                      }`}
                    >
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-600">{item.product.brand} • {item.product.crate_type} ({bottleCount} bouteilles)</p>
                        <p className="text-xs text-slate-600">Casier: {formatCurrency(item.product.crate_price)} F → {formatCurrency(unitCost)} F/bouteille</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <label className="block text-xs text-slate-600 mb-1">Prix vente/bouteille</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) => {
                                const val = e.target.value;
                                // Allow empty string for clearing, otherwise parse as float
                                handlePriceChange(item.id, val === '' ? 0 : parseFloat(val) || 0);
                              }}
                              className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <span className="text-xs text-slate-600">F</span>
                            {hasUnsavedChanges && (
                              <button
                                onClick={() => handleSavePrice(item.id, currentPrice)}
                                className="p-1 text-green-600 hover:text-green-700"
                                title="Sauvegarder"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Marge: {margin >= 0 ? '+' : ''}{formatCurrency(margin)} F ({marginPercent}%)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <p className="text-xs text-slate-600 mb-1">{item.isActive ? 'Actif' : 'Inactif'}</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={() => handleToggleActive(item.id, item.isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
