import React, { useState } from 'react';
import { Package, Plus, Edit3, Trash2, Search, Filter, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Product, ProductCategory, CrateType } from '../../types';
import { mockProducts } from '../../data/mockData';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [crateTypeFilter, setCrateTypeFilter] = useState<CrateType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    reference: '',
    name: '',
    category: 'biere',
    brand: '',
    crateType: 'B33',
    unitPrice: 0,
    cratePrice: 0,
    consignPrice: 3000,
    description: '',
    alcoholContent: 0,
    volume: '',
    isActive: true,
    imageUrl: 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'
  });

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'biere', label: 'Bières' },
    { value: 'soda', label: 'Sodas' },
    { value: 'vin', label: 'Vins' },
    { value: 'eau', label: 'Eaux' },
    { value: 'spiritueux', label: 'Spiritueux' }
  ];

  const crateTypes: { value: CrateType; label: string; description: string }[] = [
    { value: 'B33', label: 'B33', description: 'Casier 33cl/30cl (24 bouteilles)' },
    { value: 'B65', label: 'B65', description: 'Casier 65cl/50cl (12 bouteilles)' },
    { value: 'B100', label: 'B100', description: 'Casier Bock 100cl' },
    { value: 'B50V', label: 'B50V', description: 'Casier Vin Valpière 50cl' },
    { value: 'B100V', label: 'B100V', description: 'Casier Vin Valpière 100cl' },
    { value: 'C6', label: 'C6', description: '6 bouteilles (1.5L)' },
    { value: 'C20', label: 'C20', description: 'Casier 20 bouteilles' },
    { value: 'CARTON24', label: 'CARTON24', description: 'Carton 24 (jetable)' },
    { value: 'PACK6', label: 'PACK6', description: 'Pack 6 (jetable)' },
    { value: 'PACK12', label: 'PACK12', description: 'Pack 12 (jetable)' }
  ];

  const getDefaultConsignPrice = (crateType: CrateType): number => {
    switch (crateType) {
      case 'B33':
      case 'B65':
        return 3000;
      case 'B100':
      case 'B100V':
        return 3000;
      case 'B50V':
        return 3000;
      case 'C6':
        return 2000;
      case 'C20':
        return 3000;
      case 'CARTON24':
      case 'PACK6':
      case 'PACK12':
        return 0; // Disposable, no consigne
      default:
        return 3000;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
    const matchesCrateType = crateTypeFilter === 'all' || product.crateType === crateTypeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesBrand && matchesCrateType && matchesStatus;
  });

  const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();

  const handleAddProduct = () => {
    if (!newProduct.reference || !newProduct.name || !newProduct.brand) return;

    const product: Product = {
      id: Date.now().toString(),
      reference: newProduct.reference!,
      name: newProduct.name!,
      category: newProduct.category!,
      brand: newProduct.brand!,
      crateType: newProduct.crateType!,
      unitPrice: newProduct.unitPrice!,
      cratePrice: newProduct.cratePrice!,
      consignPrice: newProduct.consignPrice!,
      description: newProduct.description,
      alcoholContent: newProduct.alcoholContent,
      volume: newProduct.volume!,
      isActive: newProduct.isActive!,
      imageUrl: newProduct.imageUrl!,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProducts(prev => [...prev, product]);
    setNewProduct({
      reference: '',
      name: '',
      category: 'biere',
      brand: '',
      crateType: 'C24',
      unitPrice: 0,
      cratePrice: 0,
      consignPrice: 3000,
      description: '',
      alcoholContent: 0,
      volume: '',
      isActive: true,
      imageUrl: 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'
    });
    setShowAddForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowAddForm(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct || !newProduct.reference || !newProduct.name || !newProduct.brand) return;

    const updatedProduct: Product = {
      ...editingProduct,
      reference: newProduct.reference!,
      name: newProduct.name!,
      category: newProduct.category!,
      brand: newProduct.brand!,
      crateType: newProduct.crateType!,
      unitPrice: newProduct.unitPrice!,
      cratePrice: newProduct.cratePrice!,
      consignPrice: newProduct.consignPrice!,
      description: newProduct.description,
      alcoholContent: newProduct.alcoholContent,
      volume: newProduct.volume!,
      isActive: newProduct.isActive!,
      imageUrl: newProduct.imageUrl!,
      updatedAt: new Date()
    };

    setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
    setEditingProduct(null);
    setNewProduct({
      reference: '',
      name: '',
      category: 'biere',
      brand: '',
      crateType: 'B33',
      unitPrice: 0,
      cratePrice: 0,
      consignPrice: 3000,
      description: '',
      alcoholContent: 0,
      volume: '',
      isActive: true,
      imageUrl: 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'
    });
    setShowAddForm(false);
  };

  const toggleProductStatus = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isActive: !p.isActive, updatedAt: new Date() } : p
    ));
  };

  const deleteProduct = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
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

  const getCategoryLabel = (category: ProductCategory) => {
    const labels = {
      biere: 'Bière',
      soda: 'Soda',
      vin: 'Vin',
      eau: 'Eau',
      spiritueux: 'Spiritueux'
    };
    return labels[category];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du Catalogue</h1>
            <p className="text-gray-600">Administrez les produits disponibles sur RAVITO</p>
          </div>
          
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingProduct(null);
              setNewProduct({
                reference: '',
                name: '',
                category: 'biere',
                brand: '',
                crateType: 'B33',
                unitPrice: 0,
                cratePrice: 0,
                consignPrice: 3000,
                description: '',
                alcoholContent: 0,
                volume: '',
                isActive: true,
                imageUrl: 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'
              });
            }}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau produit</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence *</label>
              <input
                type="text"
                value={newProduct.reference}
                onChange={(e) => setNewProduct(prev => ({ ...prev, reference: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: FLAG33C24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: Flag Spéciale 33cl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
              <input
                type="text"
                value={newProduct.brand}
                onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: Flag"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value as ProductCategory }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de casier *</label>
              <select
                value={newProduct.crateType}
                onChange={(e) => {
                  const crateType = e.target.value as CrateType;
                  setNewProduct(prev => ({ 
                    ...prev, 
                    crateType,
                    consignPrice: getDefaultConsignPrice(crateType)
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {crateTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volume *</label>
              <input
                type="text"
                value={newProduct.volume}
                onChange={(e) => setNewProduct(prev => ({ ...prev, volume: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ex: 33cl, 66cl, 1.5L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire (FCFA) *</label>
              <input
                type="number"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="750"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix du casier (FCFA) *</label>
              <input
                type="number"
                value={newProduct.cratePrice}
                onChange={(e) => setNewProduct(prev => ({ ...prev, cratePrice: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="18000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix consigne (FCFA) *</label>
              <input
                type="number"
                value={newProduct.consignPrice}
                onChange={(e) => setNewProduct(prev => ({ ...prev, consignPrice: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="3000"
              />
            </div>

            {(newProduct.category === 'biere' || newProduct.category === 'vin' || newProduct.category === 'spiritueux') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teneur en alcool (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newProduct.alcoholContent}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, alcoholContent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="5.0"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Description du produit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de l'image</label>
              <input
                type="url"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingProduct(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              {editingProduct ? 'Mettre à jour' : 'Ajouter le produit'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher produits..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Toutes marques</option>
            {uniqueBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            value={crateTypeFilter}
            onChange={(e) => setCrateTypeFilter(e.target.value as CrateType | 'all')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tous casiers</option>
            {crateTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Casier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consigne</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.reference} • {product.brand}
                          </div>
                          <div className="text-xs text-gray-400">
                            {product.volume}
                            {product.alcoholContent && ` • ${product.alcoholContent}% vol`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(product.category)}`}>
                        {getCategoryLabel(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.crateType}</div>
                      <div className="text-xs text-gray-500">
                        {crateTypes.find(t => t.value === product.crateType)?.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatPrice(product.cratePrice)}</div>
                      <div className="text-xs text-gray-500">{formatPrice(product.unitPrice)}/unité</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-orange-600">{formatPrice(product.consignPrice)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className="flex items-center space-x-2"
                      >
                        {product.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Actif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">Inactif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
        {categories.map(category => {
          const count = products.filter(p => p.category === category.value && p.isActive).length;
          return (
            <div key={category.value} className="bg-white rounded-lg shadow border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{category.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};