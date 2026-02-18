import React, { useState } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Package,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react';
import { Product } from '../../../types';
import { useProductCatalog } from './useProductCatalog';
import { ProductCard } from './ProductCard';
import { ProductListRow } from './ProductListRow';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CATEGORIES, CATEGORY_LABELS, SortField } from './types';
import { CreateProductInput } from '../../../services/admin/productAdminService';

type ViewMode = 'grid' | 'list';

const StatBadge: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string }> = ({
  icon, label, value, color,
}) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color}`}>
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs opacity-70 leading-none mt-0.5">{label}</p>
    </div>
  </div>
);

export const ProductCatalogPage: React.FC = () => {
  const {
    products,
    loading,
    error,
    filters,
    setFilters,
    sortField,
    sortOrder,
    handleSort,
    stats,
    uniqueBrands,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
    reload,
  } = useProductCatalog();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateSubmit = async (input: CreateProductInput, imageFile?: File) => {
    await handleCreate(input, imageFile);
    showToast('Produit créé avec succès');
  };

  const handleUpdateSubmit = async (input: CreateProductInput, imageFile?: File) => {
    if (!editProduct) return;
    await handleUpdate(editProduct.id, input, imageFile);
    showToast('Produit mis à jour');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    await handleDelete(deleteProduct.id);
    showToast('Produit supprimé');
  };

  const handleToggle = async (product: Product) => {
    await handleToggleStatus(product.id, !product.isActive);
    showToast(product.isActive ? 'Produit désactivé' : 'Produit activé');
  };

  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className }) => (
    <th
      className={`py-3 px-2 text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-800 select-none ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : null}
      </div>
    </th>
  );

  const hasActiveFilters = filters.category || filters.brand || filters.isActive !== 'all';

  return (
    <div className="min-h-full bg-slate-50">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Catalogue Produits</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {stats.total} produit{stats.total !== 1 ? 's' : ''} · {stats.active} actif{stats.active !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reload}
              className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setEditProduct(null); setShowForm(true); }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau produit</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <StatBadge icon={<Package className="w-4 h-4 text-slate-600" />} label="Total" value={stats.total} color="bg-slate-100 text-slate-800" />
          <StatBadge icon={<CheckCircle className="w-4 h-4 text-green-600" />} label="Actifs" value={stats.active} color="bg-green-50 text-green-800" />
          <StatBadge icon={<XCircle className="w-4 h-4 text-red-400" />} label="Inactifs" value={stats.inactive} color="bg-red-50 text-red-800" />
          <StatBadge icon={<Tag className="w-4 h-4 text-blue-600" />} label="Catégories" value={stats.categories} color="bg-blue-50 text-blue-800" />
          <StatBadge icon={<TrendingUp className="w-4 h-4 text-amber-600" />} label="Marques" value={stats.brands} color="bg-amber-50 text-amber-800" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
              hasActiveFilters
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <div className="ml-auto flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={filters.brand}
              onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Toutes marques</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ search: filters.search, category: '', brand: '', isActive: 'all' })}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={reload} className="ml-auto text-red-600 hover:text-red-800 font-medium">Réessayer</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-500">Chargement des produits...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Package className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-slate-400 mt-1">
              {filters.search || hasActiveFilters
                ? 'Modifiez vos filtres ou'
                : 'Commencez par'}{' '}
              <button
                onClick={() => {
                  setFilters({ search: '', category: '', brand: '', isActive: 'all' });
                  if (!filters.search && !hasActiveFilters) {
                    setEditProduct(null);
                    setShowForm(true);
                  }
                }}
                className="text-amber-600 hover:underline"
              >
                {filters.search || hasActiveFilters ? 'réinitialisez' : 'ajouter un produit'}
              </button>
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(p) => { setEditProduct(p); setShowForm(true); }}
                onDelete={setDeleteProduct}
                onToggleStatus={handleToggle}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <SortHeader field="name" label="Produit" className="pl-4" />
                    <SortHeader field="brand" label="Marque" className="hidden sm:table-cell" />
                    <SortHeader field="category" label="Catégorie" className="hidden md:table-cell" />
                    <th className="py-3 px-2 text-xs font-semibold text-slate-500 text-left hidden lg:table-cell">Type · Volume</th>
                    <SortHeader field="cratePrice" label="Prix" className="text-right" />
                    <th className="py-3 px-2 text-xs font-semibold text-slate-500 text-right hidden md:table-cell">Consigne</th>
                    <th className="py-3 px-2 text-xs font-semibold text-slate-500 text-center hidden sm:table-cell">Statut</th>
                    <th className="py-3 pr-4 pl-2 text-xs font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <ProductListRow
                      key={product.id}
                      product={product}
                      onEdit={(p) => { setEditProduct(p); setShowForm(true); }}
                      onDelete={setDeleteProduct}
                      onToggleStatus={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              {products.length} produit{products.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSubmit={editProduct ? handleUpdateSubmit : handleCreateSubmit}
        />
      )}
      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};
