import React, { useState, useEffect, useCallback } from 'react';
import { User, Phone, MapPin, Clock, Package, Star, Edit3, Save, X, CreditCard, Building, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PaymentMethod } from '../../types';
import { ZoneSelector } from './ZoneSelector';
import { LocationPicker } from '../Shared/LocationPicker';
import { RatingBadge } from '../Shared/RatingBadge';
import { StorefrontImageUpload } from '../Shared/StorefrontImageUpload';
import { useOrganization } from '../../hooks/useOrganization';

export const ClientProfile: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const { organizationName, updateOrganization, refreshOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedStats, setHasLoadedStats] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    rating: 0,
    lastOrderDate: null as string | null
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    zoneId: user?.zoneId || '',
    businessName: '',
    organizationName: '',
    businessHours: '',
    responsiblePerson: user?.name || '',
    preferredPayments: [] as PaymentMethod[],
    deliveryLatitude: user?.deliveryLatitude || null,
    deliveryLongitude: user?.deliveryLongitude || null,
    deliveryInstructions: user?.deliveryInstructions || ''
  });

  const loadUserStats = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping stats load');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading stats for user:', user.id);

      // Fetch orders and profile rating in parallel
      const [ordersResult, profileResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('rating')
          .eq('id', user.id)
          .single()
      ]);

      if (ordersResult.error) {
        console.error('Error loading orders:', ordersResult.error);
        throw ordersResult.error;
      }

      if (profileResult.error) {
        console.error('Error loading profile rating:', profileResult.error);
        // Don't throw, just log - rating is non-critical
      }

      console.log('Orders loaded:', ordersResult.data);
      console.log('Profile rating loaded:', profileResult.data?.rating);

      const completedOrders = ordersResult.data?.filter(o => o.status === 'delivered') || [];

      setStats({
        totalOrders: ordersResult.data?.length || 0,
        completedOrders: completedOrders.length,
        rating: profileResult.data?.rating || 0,
        lastOrderDate: ordersResult.data && ordersResult.data.length > 0 ? ordersResult.data[0].created_at : null
      });

      setHasLoadedStats(true);
      console.log('Stats loaded successfully');
    } catch (error) {
      console.error('Error loading user stats:', error);
      alert('Erreur lors du chargement des statistiques. Vérifiez la console.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasLoadedStats) {
      loadUserStats();
      setFormData({
        name: user.name,
        phone: user.phone || '',
        address: user.address || '',
        zoneId: user.zoneId || '',
        businessName: (user as any).businessName || user.name,
        organizationName: organizationName || '',
        businessHours: (user as any).businessHours || '',
        responsiblePerson: (user as any).responsiblePerson || user.name,
        preferredPayments: (user as any).preferredPayments || [],
        deliveryLatitude: user.deliveryLatitude || null,
        deliveryLongitude: user.deliveryLongitude || null,
        deliveryInstructions: user.deliveryInstructions || ''
      });
    }
  }, [user, hasLoadedStats, organizationName]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentMethods = [
    { value: 'orange' as PaymentMethod, label: 'Orange Money', color: 'bg-orange-100 text-orange-700' },
    { value: 'mtn' as PaymentMethod, label: 'MTN Mobile Money', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'moov' as PaymentMethod, label: 'Moov Money', color: 'bg-blue-100 text-blue-700' },
    { value: 'wave' as PaymentMethod, label: 'Wave', color: 'bg-purple-100 text-purple-700' },
    { value: 'card' as PaymentMethod, label: 'Carte bancaire', color: 'bg-gray-100 text-gray-700' }
  ];

  const handleSave = async () => {
    if (!user) return;

    try {
      // Build base update object
      const updateData: Record<string, any> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        zone_id: formData.zoneId || null,
        business_name: formData.businessName,
        business_hours: formData.businessHours,
        responsible_person: formData.responsiblePerson
      };

      // Add geolocation fields only if they have values
      // (They will be ignored by Supabase if columns don't exist)
      if (formData.deliveryLatitude != null) {
        updateData.delivery_latitude = formData.deliveryLatitude;
      }
      if (formData.deliveryLongitude != null) {
        updateData.delivery_longitude = formData.deliveryLongitude;
      }
      if (formData.deliveryInstructions !== undefined) {
        updateData.delivery_instructions = formData.deliveryInstructions;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update organization name if it has changed
      if (formData.organizationName && formData.organizationName !== organizationName) {
        try {
          await updateOrganization({ name: formData.organizationName });
          await refreshOrganization();
        } catch (orgError) {
          console.error('Error updating organization name:', orgError);
          alert('⚠️ Profil mis à jour mais erreur lors de la mise à jour du nom de l\'établissement');
          setIsEditing(false);
          return;
        }
      }

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
      preferredPayments: prev.preferredPayments.includes(method)
        ? prev.preferredPayments.filter(m => m !== method)
        : [...prev.preferredPayments, method]
    }));
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const getTimeSince = (date: string | null) => {
    if (!date) return 'Jamais';

    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Alert for non-approved users */}
      {user && (!user.isApproved || user.approvalStatus === 'pending') && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                Complétez votre profil pour accélérer l'approbation
              </h3>
              <p className="text-amber-800 mb-4">
                Votre compte est en attente d'approbation. Pour accélérer le processus, veuillez compléter les informations suivantes :
              </p>
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>Adresse de livraison géolocalisée</strong>
                    {(!formData.address || !formData.deliveryLatitude) && (
                      <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">À compléter</span>
                    )}
                    {formData.address && formData.deliveryLatitude && (
                      <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Complété</span>
                    )}
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>Photo de la devanture de votre établissement</strong>
                    {!user.storefrontImageUrl && (
                      <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">À compléter</span>
                    )}
                    {user.storefrontImageUrl && (
                      <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Complété</span>
                    )}
                  </span>
                </li>
              </ul>
              <p className="text-sm text-amber-700 mt-4">
                💡 Ces informations seront automatiquement transmises à notre équipe dès que vous les aurez sauvegardées.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil Client</h1>
            <p className="text-gray-600">Gérez vos informations personnelles et préférences</p>
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
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {formData.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name}</h2>
            <p className="text-gray-600 mb-2">{formData.responsiblePerson}</p>
            
            {/* Rating Display - similar to SupplierProfile */}
            <div className="flex items-center justify-center space-x-1 mb-4">
              {stats.rating > 0 ? (
                <RatingBadge
                  rating={stats.rating}
                  reviewCount={stats.completedOrders}
                  userId={user?.id || ''}
                  userType="client"
                  userName={formData.name}
                  size="md"
                />
              ) : (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Pas encore de note</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">Client actif</span>
              </div>
              {formData.businessHours && (
                <p className="text-gray-600">{formData.businessHours}</p>
              )}
              <p className="text-xs text-gray-500">
                Membre depuis {formatDate(user?.createdAt || new Date())}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Commandes totales</span>
                </div>
                <span className="font-bold text-gray-900">{stats.totalOrders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Commandes livrées</span>
                </div>
                <span className="font-bold text-gray-900">{stats.completedOrders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Note moyenne</span>
                </div>
                <span className="font-bold text-gray-900">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Dernière commande</span>
                </div>
                <span className="font-bold text-gray-900">{getTimeSince(stats.lastOrderDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              Informations de contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">{user?.email}</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Vérifié</span>
                </div>
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
                    <span className="text-gray-900 font-medium">{formData.phone || 'Non renseigné'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'établissement</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Maquis Chez Tantie"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.organizationName || 'Non renseigné'}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">{formData.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Adresse de livraison
            </h3>

            {isEditing ? (
              <>
                <div className="mb-4">
                  <ZoneSelector
                    value={formData.zoneId}
                    onChange={(zoneId) => setFormData(prev => ({ ...prev, zoneId }))}
                    required={false}
                  />
                </div>
                <LocationPicker
                  initialLatitude={formData.deliveryLatitude}
                  initialLongitude={formData.deliveryLongitude}
                  initialAddress={formData.address}
                  initialInstructions={formData.deliveryInstructions || ''}
                  onLocationChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      address: location.address,
                      deliveryLatitude: location.latitude,
                      deliveryLongitude: location.longitude,
                      deliveryInstructions: location.instructions
                    }));
                  }}
                  showSearchBar={true}
                  showGpsButton={true}
                  showInstructions={true}
                />
              </>
            ) : (
              <LocationPicker
                initialLatitude={formData.deliveryLatitude}
                initialLongitude={formData.deliveryLongitude}
                initialAddress={formData.address}
                readOnly={true}
                height="200px"
              />
            )}
          </div>

          {/* Storefront Image Upload Section */}
          <StorefrontImageUpload
            userId={user?.id || ''}
            currentImageUrl={user?.storefrontImageUrl}
            onUploadSuccess={(url) => {
              console.log('Storefront image uploaded:', url);
              // Refresh user profile to update the image in the UI
              refreshUserProfile();
            }}
            onUploadError={(error) => {
              console.error('Storefront upload error:', error);
            }}
          />

          {stats.totalOrders === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <Package className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune commande pour le moment</h3>
              <p className="text-gray-600">
                Commencez à passer des commandes pour voir votre historique et vos statistiques ici.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
