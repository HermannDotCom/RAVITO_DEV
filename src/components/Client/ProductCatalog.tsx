import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { Product, ProductCategory } from '../../types';
import { getProducts, getUniqueBrands } from '../../services/productService';

export const ProductCatalog: React.FC = () => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { addToCart } = useApp();

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
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: { quantity: number; withConsigne: boolean } }>({});
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
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        quantity: Math.max(0, (prev[productId]?.quantity || 0) + delta),
        withConsigne: prev[productId]?.withConsigne || false
      }
    }));
  };

  const toggleConsigne = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        quantity: prev[productId]?.quantity || 0,
        withConsigne: !prev[productId]?.withConsigne
      }
    }));
  };

  const handleAddToCart = (product: Product) => {
    const selection = selectedProducts[product.id];
    if (selection && selection.quantity > 0) {
      // Convert old Product interface to new one for cart compatibility
      const cartProduct = {
        ...product,
        pricePerUnit: product.cratePrice, // Use crate price as the main price
        consigneAmount: product.consignPrice
      };
      addToCart(cartProduct, selection.quantity, selection.withConsigne);
      setSelectedProducts(prev => ({ ...prev, [product.id]: { quantity: 0, withConsigne: false } }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getCategoryColor = (category: ProductCategory) => {
    const colors = {
      biere: 'bg-yellow-100 text-yellow-700',
      soda: 'bg-blue-100 text-blue-700',
      vin: 'bg-purple-100 text-purple-700',
      eau: 'bg-cyan-100 text-cyan-700',
      spiritueux: 'bg-red-100 text-red-700'
    };
    return colors[category];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue Produits</h1>
        <p className="text-gray-600">Sélectionnez vos boissons pour la nuit</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Toutes les marques</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const selection = selectedProducts[product.id] || { quantity: 0, withConsigne: false };
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(product.category)}`}>
                      {product.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.brand}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{product.reference}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                      {product.crateType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Prix du casier</span>
                      <span className="text-lg font-bold text-orange-600">{formatPrice(product.cratePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Prix unitaire:</span>
                      <span className="text-gray-900 font-medium">{formatPrice(product.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Consigne</span>
                      <span className="text-gray-900 font-medium">{formatPrice(product.consignPrice)}</span>
                    </div>
                  </div>

                  {/* Quantity Selection */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Quantité</span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        disabled={selection.quantity <= 0}
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-semibold">{selection.quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-orange-600" />
                      </button>
                    </div>
                  </div>

                  {/* Consigne Option */}
                  {selection.quantity > 0 && (
                    <div className="border-t pt-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selection.withConsigne}
                          onChange={() => toggleConsigne(product.id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Avec consigne</span>
                          <p className="text-xs text-gray-500">
                            {selection.withConsigne 
                              ? 'Tarif inclut la consigne (pas de casiers vides)' 
                              : 'Je rendrai les casiers/bouteilles vides'
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            + {formatPrice(product.consignPrice * selection.quantity)} consigne
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={selection.quantity === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Ajouter au panier</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};