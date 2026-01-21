import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Clock, Package, Truck, CreditCard, Star, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod, DeliveryMethod } from '../../types';
import { getSupplierStats, SupplierStats } from '../../services/ratingService';
import { SupplierZoneSelector } from './SupplierZoneSelector';
import { LocationPicker } from '../Shared/LocationPicker';
import { supabase } from '../../lib/supabase';

export const SupplierProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    businessName: user?.businessName || user?.name || '',
    businessHours: '18h00 - 06h00',
    coverageZone: 'Plateau, Marcory, Treichville',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck' as DeliveryMethod,
    acceptedPayments: ['orange', 'mtn', 'moov', 'card'] as PaymentMethod[],
    zoneId: user?.zoneId || '',
    depotLatitude: null as number | null,
    depotLongitude: null as number | null,
    depotAddress: '',
    accessInstructions: ''
  });

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('depot_latitude, depot_longitude, depot_address, access_instructions, zone_id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        businessName: user.businessName || user.name || '',
        zoneId: data?.zone_id || user.zoneId || '',
        depotLatitude: data?.depot_latitude || null,
        depotLongitude: data?.depot_longitude || null,
        depotAddress: data?.depot_address || '',
        accessInstructions: data?.access_instructions || ''
      }));
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

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

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStats = async () => {
    if (!user?.id) return;

    setIsLoadingStats(true);
    try {
      const supplierStats = await getSupplierStats(user.id);
      setStats(supplierStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Build base update object
      const updateData: Record<string, string | number | boolean | null> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        business_name: formData.businessName,
        zone_id: formData.zoneId || null
      };

      // Add depot geolocation fields
      if (formData.depotLatitude !== null && formData.depotLongitude !== null) {
        updateData.depot_latitude = formData.depotLatitude;
        updateData.depot_longitude = formData.depotLongitude;
      }
      updateData.depot_address = formData.depotAddress;
      updateData.access_instructions = formData.accessInstructions;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      alert('✅ Profil mis à jour avec succès!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Erreur lors de la mise à jour du profil');
    }
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
              {isLoadingStats ? (
                <span className="text-lg text-gray-400">Chargement...</span>
              ) : (
                <>
                  <span className="text-lg font-bold">{stats?.averageRating || 0}</span>
                  <span className="text-gray-600">({stats?.totalDeliveries || 0} livraisons)</span>
                </>
              )}
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

          {/* Depot Geolocation Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Adresse du dépôt
            </h3>

            {isEditing ? (
              <>
                <div className="mb-4">
                  <SupplierZoneSelector
                    value={formData.zoneId}
                    onChange={(zoneId) => setFormData(prev => ({ ...prev, zoneId }))}
                    required={false}
                  />
                </div>
                <LocationPicker
                  initialLatitude={formData.depotLatitude}
                  initialLongitude={formData.depotLongitude}
                  initialAddress={formData.depotAddress}
                  initialInstructions={formData.accessInstructions || ''}
                  onLocationChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      depotAddress: location.address,
                      depotLatitude: location.latitude,
                      depotLongitude: location.longitude,
                      accessInstructions: location.instructions
                    }));
                  }}
                  showSearchBar={true}
                  showGpsButton={true}
                  showInstructions={true}
                  instructionsLabel="Indications d'accès au dépôt"
                  instructionsPlaceholder="Ex: Portail bleu, à côté de la station Total..."
                />
              </>
            ) : (
              <>
                {formData.depotLatitude && formData.depotLongitude ? (
                  <LocationPicker
                    initialLatitude={formData.depotLatitude}
                    initialLongitude={formData.depotLongitude}
                    initialAddress={formData.depotAddress}
                    readOnly={true}
                    height="200px"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune adresse de dépôt configurée</p>
                    <p className="text-xs mt-1">Cliquez sur "Modifier" pour ajouter l'adresse de votre dépôt</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-orange-600" />
              Performances
            </h3>
            
            {isLoadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des statistiques...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{stats?.totalDeliveries || 0}</div>
                  <div className="text-xs text-gray-600">Livraisons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats?.averageRating || 0}</div>
                  <div className="text-xs text-gray-600">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{stats?.averageDeliveryTime || 0}</div>
                  <div className="text-xs text-gray-600">Temps moyen (min)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats?.successRate || 0}%</div>
                  <div className="text-xs text-gray-600">Taux de réussite</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Ratings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évaluations récentes</h3>

            {isLoadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : stats?.recentRatings && stats.recentRatings.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRatings.map((rating) => (
                  <div key={rating.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {rating.from_user?.business_name || rating.from_user?.name || 'Client'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{rating.overall.toFixed(1)}</span>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 mb-1">{rating.comment}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(rating.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <div className="flex space-x-3 text-xs">
                        <span>Ponctualité: {rating.punctuality}/5</span>
                        <span>Qualité: {rating.quality}/5</span>
                        <span>Communication: {rating.communication}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune évaluation pour le moment</p>
                <p className="text-xs mt-1">Les évaluations apparaîtront après vos premières livraisons</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};