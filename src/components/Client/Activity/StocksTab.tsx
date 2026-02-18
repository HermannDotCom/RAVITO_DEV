import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, RefreshCw, Search, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyStockLine } from '../../../types/activity';
import { UpdateStockLineData } from '../../../types/activity';
import {
  searchCatalogProducts,
  addProductToDailySheet,
  removeProductFromDailySheet,
} from '../../../services/dailySheetService';

interface StocksTabProps {
  stockLines: DailyStockLine[];
  dailySheetId: string;
  organizationId: string;
  isReadOnly: boolean;
  syncing: boolean;
  onUpdateStockLine: (lineId: string, data: UpdateStockLineData) => Promise<boolean>;
  onSyncDeliveries: () => Promise<boolean>;
  onProductAdded: () => Promise<void>;
  onProductRemoved: () => Promise<void>;
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

const CRATE_BOTTLE_COUNT: Record<string, number> = {
  'B33': 24,
  'B65': 12,
  'B100': 1,
  'B50V': 1,
  'B100V': 1,
  'C6': 6,
  'C20': 20,
  'CARTON24': 24,
  'CARTON6': 6,
  'PACK6': 6,
  'PACK12': 12,
};

export const StocksTab: React.FC<StocksTabProps> = ({
  stockLines,
  dailySheetId,
  organizationId,
  isReadOnly,
  syncing,
  onUpdateStockLine,
  onSyncDeliveries,
  onProductAdded,
  onProductRemoved,
}) => {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ externalSupply?: number; finalStock?: number }>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(true);
  
  // Form state for adding product
  const [productForms, setProductForms] = useState<Record<string, { initialStock: string; sellingPrice: string }>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search products with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setSearching(true);
        const excludeIds = stockLines.map(line => line.productId);
        const { data, error } = await searchCatalogProducts(
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
  }, [searchQuery, selectedCategory, stockLines]);

  const handleEdit = (line: DailyStockLine) => {
    setEditingLineId(line.id);
    setEditValues({
      externalSupply: line.externalSupply,
      finalStock: line.finalStock || undefined,
    });
  };

  const handleSave = async (lineId: string) => {
    const success = await onUpdateStockLine(lineId, editValues);
    if (success) {
      setEditingLineId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingLineId(null);
    setEditValues({});
  };

  const handleAddProduct = async (product: CatalogProduct) => {
    const form = productForms[product.id];
    if (!form || !form.initialStock || !form.sellingPrice) {
      setMessage({ type: 'error', text: 'Veuillez remplir le stock initial et le prix de vente' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setAddingProductId(product.id);
    const { success, error } = await addProductToDailySheet(
      organizationId,
      dailySheetId,
      product.id,
      parseInt(form.initialStock),
      parseInt(form.sellingPrice)
    );

    if (success) {
      setMessage({ type: 'success', text: 'Produit ajouté avec succès' });
      setSearchQuery('');
      setSearchResults([]);
      setProductForms({});
      await onProductAdded();
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de l\'ajout' });
    }

    setAddingProductId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveProduct = async (lineId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit du suivi ?')) return;

    setRemovingProductId(lineId);
    const { success, error } = await removeProductFromDailySheet(lineId);

    if (success) {
      setMessage({ type: 'success', text: 'Produit retiré avec succès' });
      await onProductRemoved();
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de la suppression' });
    }

    setRemovingProductId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBottleCount = (crateType: string): number => {
    return CRATE_BOTTLE_COUNT[crateType] || 24;
  };

  const calculateUnitCost = (cratePrice: number, crateType: string): number => {
    const bottleCount = getBottleCount(crateType);
    return Math.round(cratePrice / bottleCount);
  };

  const calculateMargin = (sellingPrice: number, cratePrice: number, crateType: string) => {
    const unitCost = calculateUnitCost(cratePrice, crateType);
    const margin = sellingPrice - unitCost;
    const marginPercent = unitCost > 0 ? ((margin / unitCost) * 100).toFixed(0) : '0';
    return { unitCost, margin, marginPercent };
  };

  const totalRevenue = stockLines.reduce((sum, line) => sum + (line.revenue || 0), 0);
  const totalSales = stockLines.reduce((sum, line) => sum + (line.salesQty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Message Toast */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-slate-900">Suivi des Stocks</h2>
        </div>
        <button
          onClick={onSyncDeliveries}
          disabled={syncing || isReadOnly}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync Livraisons RAVITO</span>
          <span className="sm:hidden">Sync</span>
        </button>
      </div>

      {/* Add Product Section */}
      {!isReadOnly && (
        <div className="bg-white border border-orange-200 rounded-xl overflow-hidden">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Rechercher un produit (min. 3 car.)..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Search results */}
              {searching && (
                <div className="text-center text-slate-500 text-sm py-4">Recherche en cours...</div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map(product => {
                    const bottleCount = getBottleCount(product.crate_type);
                    const unitCost = calculateUnitCost(product.crate_price, product.crate_type);
                    const form = productForms[product.id] || { initialStock: '', sellingPrice: '' };
                    const sellingPrice = form.sellingPrice ? parseInt(form.sellingPrice) : 0;
                    const margin = sellingPrice > 0 ? calculateMargin(sellingPrice, product.crate_price, product.crate_type) : null;

                    return (
                      <div key={product.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                          <p className="text-xs text-slate-600">{product.brand} • {product.crate_type} ({bottleCount} bout.)</p>
                          <p className="text-xs text-slate-600">Coût: {formatCurrency(unitCost)} F/bout.</p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-slate-600 whitespace-nowrap">Stock initial:</label>
                              <input
                                type="number"
                                min="0"
                                value={form.initialStock}
                                onChange={(e) => setProductForms({
                                  ...productForms,
                                  [product.id]: { ...form, initialStock: e.target.value }
                                })}
                                placeholder="0"
                                className="w-20 px-2 py-2 min-h-[40px] text-sm border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-slate-600 whitespace-nowrap">Prix vente:</label>
                              <input
                                type="number"
                                min="0"
                                value={form.sellingPrice}
                                onChange={(e) => setProductForms({
                                  ...productForms,
                                  [product.id]: { ...form, sellingPrice: e.target.value }
                                })}
                                placeholder="0"
                                className="w-24 px-2 py-2 min-h-[40px] text-sm border border-slate-300 rounded-lg"
                              />
                              <span className="text-xs text-slate-600">F/bout.</span>
                            </div>
                          </div>
                          
                          {margin && (
                            <p className={`text-xs mt-1 ${margin.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Marge: {margin.margin >= 0 ? '+' : ''}{formatCurrency(margin.margin)} F ({margin.marginPercent}%)
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          disabled={addingProductId === product.id}
                          className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-300 text-sm font-medium whitespace-nowrap"
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
                <div className="text-center text-slate-500 text-sm py-4">
                  Aucun produit trouvé
                </div>
              )}

              {searchQuery.length < 3 && (
                <div className="text-center text-slate-400 text-sm py-4">
                  Saisissez au moins 3 caractères pour rechercher
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs sm:text-sm text-green-800 font-medium">CA Théorique</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-900">
            {formatCurrency(totalRevenue)} FCFA
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <p className="text-xs sm:text-sm text-blue-800 font-medium">Total Ventes</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">
            {totalSales} unités
          </p>
        </div>
      </div>

      {/* Stock table - Mobile view */}
      <div className="sm:hidden space-y-3">
        {stockLines.map((line) => {
          const isEditing = editingLineId === line.id;
          const sellingPrice = line.establishmentProduct?.sellingPrice || 0;
          const totalSupply = line.ravitoSupply + (isEditing ? (editValues.externalSupply || 0) : line.externalSupply);
          const finalStock = isEditing ? (editValues.finalStock ?? line.finalStock) : line.finalStock;
          const salesQty = finalStock !== null && finalStock !== undefined
            ? line.initialStock + totalSupply - finalStock
            : undefined;
          const revenue = salesQty && sellingPrice ? salesQty * sellingPrice : 0;

          // Calculate margin
          const cratePrice = line.product?.crate_price || 0;
          const crateType = line.product?.crate_type || 'B33';
          const { margin } = calculateMargin(sellingPrice, cratePrice, crateType);

          return (
            <div
              key={line.id}
              className="bg-white rounded-xl p-3 border border-orange-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 text-sm">
                    {line.product?.name || 'Produit'}
                  </h3>
                  <p className="text-xs text-slate-600">{line.product?.brand}</p>
                  <p className="text-xs text-orange-600 font-medium">
                    {formatCurrency(sellingPrice)} F/bout. • Marge: {formatCurrency(margin)} F
                  </p>
                </div>
                {!isReadOnly && !isEditing && (
                  <button
                    onClick={() => handleRemoveProduct(line.id)}
                    disabled={removingProductId === line.id}
                    className="flex items-center justify-center w-10 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-600">Stock Initial</p>
                  <p className="font-medium text-slate-900">{line.initialStock}</p>
                </div>
                <div>
                  <p className="text-slate-600">RAVITO</p>
                  <p className="font-medium text-blue-900">{line.ravitoSupply}</p>
                </div>
                <div>
                  <p className="text-slate-600">Achats Ext.</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editValues.externalSupply || 0}
                      onChange={(e) =>
                        setEditValues({ ...editValues, externalSupply: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{line.externalSupply}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Stock Final</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editValues.finalStock ?? ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, finalStock: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{finalStock ?? '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Ventes</p>
                  <p className="font-medium text-green-900">{salesQty ?? '-'}</p>
                </div>
                <div>
                  <p className="text-slate-600">CA</p>
                  <p className="font-medium text-green-900">
                    {revenue > 0 ? `${formatCurrency(revenue)} F` : '-'}
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="mt-3">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(line.id)}
                        className="flex-1 px-3 py-2.5 min-h-[44px] bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-2.5 min-h-[44px] bg-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-400"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(line)}
                      className="w-full px-3 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stock table - Desktop view */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-xl border border-orange-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="text-left py-3 px-2 font-semibold">Produit</th>
              <th className="text-center py-3 px-2 font-semibold">Prix Vente</th>
              <th className="text-center py-3 px-2 font-semibold">Marge</th>
              <th className="text-center py-3 px-2 font-semibold">Stock Init.</th>
              <th className="text-center py-3 px-2 font-semibold">RAVITO</th>
              <th className="text-center py-3 px-2 font-semibold">Achats Ext.</th>
              <th className="text-center py-3 px-2 font-semibold">Stock Final</th>
              <th className="text-center py-3 px-2 font-semibold">Ventes</th>
              <th className="text-right py-3 px-2 font-semibold">CA (FCFA)</th>
              {!isReadOnly && <th className="text-center py-3 px-2 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {stockLines.map((line) => {
              const isEditing = editingLineId === line.id;
              const sellingPrice = line.establishmentProduct?.sellingPrice || 0;
              const totalSupply = line.ravitoSupply + (isEditing ? (editValues.externalSupply || 0) : line.externalSupply);
              const finalStock = isEditing ? (editValues.finalStock ?? line.finalStock) : line.finalStock;
              const salesQty = finalStock !== null && finalStock !== undefined
                ? line.initialStock + totalSupply - finalStock
                : undefined;
              const revenue = salesQty && sellingPrice ? salesQty * sellingPrice : 0;

              // Calculate margin
              const cratePrice = line.product?.crate_price || 0;
              const crateType = line.product?.crate_type || 'B33';
              const { margin, marginPercent } = calculateMargin(sellingPrice, cratePrice, crateType);

              return (
                <tr key={line.id} className="border-b border-slate-100 hover:bg-orange-50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">{line.product?.name || 'Produit'}</div>
                    <div className="text-xs text-slate-600">{line.product?.brand}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-orange-700 font-medium">{formatCurrency(sellingPrice)} F</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-medium ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {margin >= 0 ? '+' : ''}{formatCurrency(margin)} F
                    </span>
                    <div className="text-xs text-slate-600">({marginPercent}%)</div>
                  </td>
                  <td className="py-3 px-2 text-center">{line.initialStock}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-blue-700 font-medium">{line.ravitoSupply}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.externalSupply || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, externalSupply: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      line.externalSupply
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.finalStock ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, finalStock: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      finalStock ?? '-'
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-green-700 font-medium">{salesQty ?? '-'}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-green-700 font-medium">
                      {revenue > 0 ? formatCurrency(revenue) : '-'}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSave(line.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEdit(line)}
                            className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(line.id)}
                            disabled={removingProductId === line.id}
                            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-orange-300 bg-orange-50">
              <td className="py-3 px-2 font-bold text-slate-900">TOTAL</td>
              <td className="py-3 px-2"></td>
              <td className="py-3 px-2"></td>
              <td className="py-3 px-2 text-center font-bold">
                {stockLines.reduce((sum, l) => sum + l.initialStock, 0)}
              </td>
              <td className="py-3 px-2 text-center font-bold text-blue-700">
                {stockLines.reduce((sum, l) => sum + l.ravitoSupply, 0)}
              </td>
              <td className="py-3 px-2 text-center font-bold">
                {stockLines.reduce((sum, l) => sum + l.externalSupply, 0)}
              </td>
              <td className="py-3 px-2 text-center">-</td>
              <td className="py-3 px-2 text-center font-bold text-green-700">{totalSales}</td>
              <td className="py-3 px-2 text-right font-bold text-green-700">
                {formatCurrency(totalRevenue)}
              </td>
              {!isReadOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {stockLines.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-orange-200">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50 text-orange-600" />
          <p className="font-medium">Aucun produit configuré</p>
          <p className="text-sm mt-1">Utilisez la recherche ci-dessus pour ajouter des produits</p>
        </div>
      )}
    </div>
  );
};
