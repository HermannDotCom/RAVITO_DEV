import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from '../../../services/admin/productAdminService';
import { uploadProductImage, deleteProductImage } from '../../../services/imageUploadService';
import { Product } from '../../../types';
import { ProductFilters, SortField, SortOrder } from './types';

export function useProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    brand: '',
    isActive: 'all',
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch {
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
    return brands;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters.brand) {
      result = result.filter((p) => p.brand === filters.brand);
    }
    if (filters.isActive !== 'all') {
      result = result.filter((p) => p.isActive === (filters.isActive === 'active'));
    }

    result.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'brand':
          valA = a.brand;
          valB = b.brand;
          break;
        case 'category':
          valA = a.category;
          valB = b.category;
          break;
        case 'cratePrice':
          valA = a.cratePrice;
          valB = b.cratePrice;
          break;
        case 'unitPrice':
          valA = a.unitPrice;
          valB = b.unitPrice;
          break;
        case 'createdAt':
          valA = a.createdAt.getTime();
          valB = b.createdAt.getTime();
          break;
        default:
          valA = a.name;
          valB = b.name;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [products, filters, sortField, sortOrder]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    inactive: products.filter((p) => !p.isActive).length,
    categories: new Set(products.map((p) => p.category)).size,
    brands: new Set(products.map((p) => p.brand)).size,
  }), [products]);

  const handleCreate = async (input: CreateProductInput, imageFile?: File): Promise<void> => {
    const product = await createProduct(input);
    if (imageFile) {
      const result = await uploadProductImage(imageFile, product.id, product.category);
      if (result.success && result.url) {
        await updateProduct(product.id, { imageUrl: result.url, imagePath: result.path });
      }
    }
    await loadProducts();
  };

  const handleUpdate = async (id: string, input: UpdateProductInput, imageFile?: File): Promise<void> => {
    if (imageFile) {
      const existingProduct = products.find((p) => p.id === id);
      if (existingProduct?.imagePath) {
        await deleteProductImage(existingProduct.imagePath);
      }
      const result = await uploadProductImage(imageFile, id, input.category || existingProduct?.category);
      if (result.success && result.url) {
        input = { ...input, imageUrl: result.url, imagePath: result.path };
      }
    }
    await updateProduct(id, input);
    await loadProducts();
  };

  const handleDelete = async (id: string): Promise<void> => {
    const product = products.find((p) => p.id === id);
    if (product?.imagePath) {
      await deleteProductImage(product.imagePath);
    }
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleStatus = async (id: string, isActive: boolean): Promise<void> => {
    await toggleProductStatus(id, isActive);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return {
    products: filteredProducts,
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
    reload: loadProducts,
  };
}
