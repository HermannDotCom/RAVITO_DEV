import React, { useState } from 'react';
import { User, Phone, MapPin, Clock, Package, Star, Edit3, Save, X, CreditCard, Building, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod } from '../../types';

export const ClientProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    businessName: (user as any)?.businessName || 'Mon Établissement',
    businessHours: (user as any)?.businessHours || '18h00 - 06h00',
    responsiblePerson: (user as any)?.responsiblePerson || user?.name || '',
    preferredPayments: (user as any)?.preferredPayments || ['orange', 'mtn'] as PaymentMethod[]
  });

  const paymentMethods = [
    { value: 'orange' as PaymentMethod, label: 'Orange Money', color: 'bg-orange-100 text-orange-700' },
    { value: 'mtn' as PaymentMethod, label: 'MTN Mobile Money', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'moov' as PaymentMethod, label: 'Moov Money', color: 'bg-blue-100 text-blue-700' },
    { value: 'wave' as PaymentMethod, label: 'Wave', color: 'bg-purple-100 text-purple-700' },
    { value: 'card' as PaymentMethod, label: 'Carte bancaire', color: 'bg-gray-100 text-gray-700' }
  ];

  const handleSave = () => {
    // Here you would typically save to backend
    setIsEditing(false);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setFormData(prev => ({
      ...prev,
      preferredPayments: prev.preferredPayments.includes(method)
        ? prev.preferredPayments.filter(m => m !== method)
        : [...prev.preferredPayments, method]
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {formData.businessName.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.businessName}</h2>
            <p className="text-gray-600 mb-4">{formData.responsiblePerson}</p>
            
            <div className="flex items-center justify-center space-x-1 mb-4">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-bold">{user?.rating || 4.5}</span>
              <span className="text-gray-600">({user?.totalOrders || 23} commandes)</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">Client actif</span>
              </div>
              <p className="text-gray-600">{formData.businessHours}</p>
              <p className="text-xs text-gray-500">
                Membre depuis {formatDate(user?.createdAt || new Date())}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Commandes totales</span>
                </div>
                <span className="font-bold text-gray-900">{user?.totalOrders || 23}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Note moyenne</span>
                </div>
                <span className="font-bold text-gray-900">{user?.rating || 4.5}/5</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Temps moyen livraison</span>
                </div>
                <span className="font-bold text-gray-900">22 min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Dernière commande</span>
                </div>
                <span className="font-bold text-gray-900">Il y a 2 jours</span>
              </div>
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
                    <span className="text-gray-900 font-medium">{formData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Responsable/Contact principal</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.responsiblePerson}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de l'établissement</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
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
              <Building className="h-5 w-5 mr-2 text-orange-600" />
              Informations de l'établissement
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'établissement</label>
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
                    placeholder="Ex: 18h00 - 06h00"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">{formData.businessHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Zone de livraison</h4>
                  <p className="text-blue-700 text-sm">
                    Votre établissement est situé dans la zone de livraison couverte par nos fournisseurs partenaires.
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Temps de livraison moyen: 20-25 minutes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Preferences */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
              Moyens de paiement préférés
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez vos moyens de paiement préférés pour faciliter vos commandes
            </p>
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => togglePaymentMethod(method.value)}
                    className={`p-3 text-sm border-2 rounded-lg transition-all text-left ${
                      formData.preferredPayments.includes(method.value)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.preferredPayments.map((method) => {
                  const methodInfo = paymentMethods.find(m => m.value === method);
                  return (
                    <div
                      key={method}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${methodInfo?.color || 'bg-gray-100 text-gray-700'}`}
                    >
                      <div className="h-2 w-2 bg-current rounded-full opacity-60"></div>
                      <span className="font-medium">{methodInfo?.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order History Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              Historique des commandes
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{user?.totalOrders || 23}</div>
                <div className="text-xs text-gray-600">Total commandes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">21</div>
                <div className="text-xs text-gray-600">Livrées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">2</div>
                <div className="text-xs text-gray-600">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                <div className="text-xs text-gray-600">Annulées</div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Commandes récentes</h4>
              {[              ].map((order, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{order.id}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Livrée' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{order.date}</span>
                    <span className="font-bold text-gray-900">
                      {new Intl.NumberFormat('fr-FR').format(order.total)} FCFA
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Fournisseur: {order.supplier}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences and Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Préférences de notification</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">SMS</span>
                  <p className="text-sm text-gray-600">Notifications par SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Email</span>
                  <p className="text-sm text-gray-600">Confirmations par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Push</span>
                  <p className="text-sm text-gray-600">Notifications dans l'app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Delivery Preferences */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Préférences de livraison</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Créneaux préférés</label>
                <div className="grid grid-cols-2 gap-2">
                  {['18h-20h', '20h-22h', '22h-00h', '00h-02h', '02h-04h', '04h-06h'].map((slot) => (
                    <button
                      key={slot}
                      className="p-2 text-sm border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions de livraison</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                  placeholder="Instructions spéciales pour les livreurs (ex: sonner 2 fois, entrée par derrière...)"
                />
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sécurité du compte</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Mot de passe</span>
                  <p className="text-sm text-gray-600">Dernière modification il y a 30 jours</p>
                </div>
                <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                  Modifier
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">Authentification 2FA</span>
                  <p className="text-sm text-gray-600">Sécurité renforcée</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Évaluations récentes reçues</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { supplier: 'Dépôt du Plateau', rating: 4.8, comment: 'Client très ponctuel et respectueux', date: '15 Déc' },
            { supplier: 'Dépôt Cocody Express', rating: 4.5, comment: 'Bon client, paiement rapide', date: '13 Déc' },
            { supplier: 'Dépôt Marcory', rating: 5.0, comment: 'Excellent client, je recommande', date: '10 Déc' }
          ].map((review, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{review.supplier}</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold">{review.rating}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
              <span className="text-xs text-gray-500">{review.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions du compte</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Package className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Exporter mes données</span>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Historique complet</span>
          </button>
          
          <button className="p-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-center">
            <X className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Supprimer le compte</span>
          </button>
        </div>
      </div>
    </div>
  );
};