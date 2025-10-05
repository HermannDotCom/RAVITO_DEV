import React, { useState } from 'react';
import { User, Phone, MapPin, Clock, Package, Truck, CreditCard, Star, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod, DeliveryMethod } from '../../types';

export const SupplierProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    businessName: 'Dépôt du Plateau',
    businessHours: '18h00 - 06h00',
    coverageZone: 'Plateau, Marcory, Treichville',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck' as DeliveryMethod,
    acceptedPayments: ['orange', 'mtn', 'moov', 'card'] as PaymentMethod[]
  });

  const paymentMethods = [
    { value: 'orange' as PaymentMethod, label: 'Orange Money' },
    { value: 'mtn' as PaymentMethod, label: 'MTN Mobile Money' },
    { value: 'moov' as PaymentMethod, label: 'Moov Money' },
    { value: 'wave' as PaymentMethod, label: 'Wave' },
    { value: 'card' as PaymentMethod, label: 'Carte bancaire' }
  ];

  const deliveryOptions = [
    { value: 'motorcycle' as DeliveryMethod, label: 'Moto', icon: '🏍️' },
    { value: 'tricycle' as DeliveryMethod, label: 'Tricycle', icon: '🛺' },
    { value: 'truck' as DeliveryMethod, label: 'Camion', icon: '🚛' }
  ];

  const handleSave = () => {
    // Here you would typically save to backend
    setIsEditing(false);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setFormData(prev => ({
      ...prev,
      acceptedPayments: prev.acceptedPayments.includes(method)
        ? prev.acceptedPayments.filter(m => m !== method)
        : [...prev.acceptedPayments, method]
    }));
  };

  const toggleProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      availableProducts: prev.availableProducts.includes(product)
        ? prev.availableProducts.filter(p => p !== product)
        : [...prev.availableProducts, product]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil Fournisseur</h1>
            <p className="text-gray-600">Gérez vos informations et paramètres</p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Sauvegarder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {formData.businessName.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.businessName}</h2>
            <p className="text-gray-600 mb-4">{formData.name}</p>
            
            <div className="flex items-center justify-center space-x-1 mb-4">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-bold">{user?.rating || 4.7}</span>
              <span className="text-gray-600">({user?.totalOrders || 156} livraisons)</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">Disponible</span>
              </div>
              <p className="text-gray-600">{formData.businessHours}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              Informations de contact
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du responsable</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du dépôt</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              ) : (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <span className="text-gray-900">{formData.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              Informations commerciales
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du dépôt</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.businessName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horaires d'ouverture</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.businessHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessHours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.businessHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone de couverture</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.coverageZone}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverageZone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{formData.coverageZone}</p>
              )}
            </div>

            {/* Available Products */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Produits disponibles</label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {['Solibra', 'Brassivoire'].map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`p-3 text-sm border rounded-lg transition-all ${
                        formData.availableProducts.includes(product)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex space-x-2">
                  {formData.availableProducts.map((product) => (
                    <span
                      key={product}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        product === 'Solibra' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacité de livraison</label>
              {isEditing ? (
                <select
                  value={formData.deliveryCapacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryCapacity: e.target.value as DeliveryMethod }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {deliveryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">
                    {deliveryOptions.find(opt => opt.value === formData.deliveryCapacity)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
              Moyens de paiement acceptés
            </h3>
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => togglePaymentMethod(method.value)}
                    className={`p-3 text-sm border rounded-lg transition-all text-left ${
                      formData.acceptedPayments.includes(method.value)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.acceptedPayments.map((method) => {
                  const methodInfo = paymentMethods.find(m => m.value === method);
                  return (
                    <div
                      key={method}
                      className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-700 font-medium">{methodInfo?.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-orange-600" />
              Performances
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">156</div>
                <div className="text-xs text-gray-600">Livraisons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">4.7</div>
                <div className="text-xs text-gray-600">Note moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">18</div>
                <div className="text-xs text-gray-600">Temps moyen (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">98%</div>
                <div className="text-xs text-gray-600">Taux de réussite</div>
              </div>
            </div>
          </div>

          {/* Recent Ratings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évaluations récentes</h3>
            
            <div className="space-y-3">
              {[
                { client: 'Maquis Belle Vue', rating: 5, comment: 'Livraison rapide et produits en parfait état', date: '15 Déc' },
                { client: 'Bar Le Plateau', rating: 4, comment: 'Très professionnel, je recommande', date: '14 Déc' },
                { client: 'Maquis des Lauriers', rating: 5, comment: 'Excellent service, ponctuel', date: '13 Déc' }
              ].map((review, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{review.client}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{review.comment}</p>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};