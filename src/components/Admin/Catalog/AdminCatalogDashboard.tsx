import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { Product, ProductCategory, CrateType } from '../../../types';
import { Card } from '../../ui/Card';
import { ProductTable } from './ProductTable';
import { ProductForm, ProductFormData } from './ProductForm';
import { DeleteProductModal } from './DeleteProductModal';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from '../../../services/admin/productAdminService';

export const AdminCatalogDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Apply filters when products or filters change
  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, categoryFilter, brandFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getAdminProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.reference.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter((p) => p.brand === brandFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) =>
        statusFilter === 'active' ? p.isActive : !p.isActive
      );
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const updated = await toggleProductStatus(product.id, !product.isActive);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      setIsSaving(true);

      if (editingProduct) {
        // Update existing product
        const updated = await updateProduct(editingProduct.id, {
          reference: data.reference,
          name: data.name,
          category: data.category,
          brand: data.brand,
          crateType: data.crateType,
          volume: data.volume,
          unitPrice: data.unitPrice,
          cratePrice: data.cratePrice,
          consignPrice: data.consignPrice,
          description: data.description,
          alcoholContent: data.alcoholContent,
          imagePath: data.imagePath,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
        });
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // Create new product
        const created = await createProduct({
          reference: data.reference,
          name: data.name,
          category: data.category,
          brand: data.brand,
          crateType: data.crateType,
          volume: data.volume,
          unitPrice: data.unitPrice,
          cratePrice: data.cratePrice,
          consignPrice: data.consignPrice,
          description: data.description,
          alcoholContent: data.alcoholContent,
          imagePath: data.imagePath,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
        });
        setProducts((prev) => [...prev, created]);
      }

      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de l\'enregistrement du produit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression du produit');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique brands for filter
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand))).sort();

  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'biere', label: 'Bières' },
    { value: 'soda', label: 'Sodas' },
    { value: 'vin', label: 'Vins' },
    { value: 'eau', label: 'Eaux' },
    { value: 'spiritueux', label: 'Spiritueux' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Catalogue Produits
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestion complète du catalogue RAVITO avec upload d'images
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={handleCreateProduct}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {products.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Produits Actifs</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {products.filter((p) => p.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Produits Inactifs</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {products.filter((p) => !p.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Marques</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {uniqueBrands.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Toutes les marques</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </Card>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <DeleteProductModal
          product={productToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setProductToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
