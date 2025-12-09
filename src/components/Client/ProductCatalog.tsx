import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { Product, ProductCategory } from '../../types';
import { getProducts, getUniqueBrands } from '../../services/productService';
import { ProductCard } from '../ui/ProductCard';
import { Card } from '../ui/Card';

export const ProductCatalog: React.FC = () => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { addToCart, cart } = useCart();

  const accessRestrictions = getAccessRestrictions();

  // Restriction d'accès sécurisée
  if (!accessRestrictions.canAccessCatalog) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Accès restreint</h2>
          <p className="text-red-800 mb-4">
            {accessRestrictions.restrictionReason}
          </p>
          <p className="text-sm text-red-700">
            {user?.role === 'client' 
              ? 'Votre demande est en cours d\'examen. Vous recevrez une notification dès l\'approbation.'
              : 'Accès non autorisé au catalogue produits.'
            }
          </p>
        </div>
      </div>
    );
  }
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, [categoryFilter, brandFilter]);

  const loadProducts = async () => {
    setIsLoading(true);
    const filters: any = { isActive: true };

    if (categoryFilter !== 'all') {
      filters.category = categoryFilter;
    }

    if (brandFilter !== 'all') {
      filters.brand = brandFilter;
    }

    const fetchedProducts = await getProducts(filters);
    setProducts(fetchedProducts);
    setIsLoading(false);
  };

  const loadBrands = async () => {
    const fetchedBrands = await getUniqueBrands();
    setBrands(fetchedBrands);
  };

  const categories = [
    { value: 'all' as const, label: 'Tous les produits' },
    { value: 'biere' as const, label: 'Bières' },
    { value: 'soda' as const, label: 'Sodas' },
    { value: 'vin' as const, label: 'Vins' },
    { value: 'eau' as const, label: 'Eaux' },
    { value: 'spiritueux' as const, label: 'Spiritueux' }
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  const updateQuantity = (productId: string, delta: number) => {
    // Not needed anymore - handled by ProductCard
  };

  const toggleConsigne = (productId: string) => {
    // Not needed anymore - handled by ProductCard
  };

  const handleAddToCart = (productId: string, quantity: number, withConsigne: boolean) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(product, quantity, withConsigne);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue Produits</h1>
        <p className="text-gray-600">Sélectionnez vos boissons pour la nuit</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            >
              <option value="all">Toutes les marques</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const cartQuantity = getCartQuantity(product.id);
          const isInCart = cartQuantity > 0;
          
          return (
            <div key={product.id} className="animate-fade-in-up">
              <ProductCard
                product={product}
                onAddToCart={(quantity, withConsigne) => handleAddToCart(product.id, quantity, withConsigne)}
                isInCart={isInCart}
                cartQuantity={cartQuantity}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};