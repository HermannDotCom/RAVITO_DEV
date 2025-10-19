import React, { useState } from 'react';
import { Mail, Lock, Phone, MapPin, Building, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, PaymentMethod, DeliveryMethod } from '../../types';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    role: 'client' as UserRole,
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    businessName: '',
    responsiblePerson: '',
    businessHours: '',
    preferredPayments: [] as PaymentMethod[],
    coverageZone: '',
    availableProducts: [] as string[],
    deliveryCapacity: 'motorcycle' as DeliveryMethod,
    acceptedPayments: [] as PaymentMethod[]
  });
  
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'orange', label: 'Orange Money' },
    { value: 'mtn', label: 'MTN Mobile Money' },
    { value: 'moov', label: 'Moov Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'card', label: 'Carte bancaire' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const success = await register(formData);
    if (!success) {
      setError('Erreur lors de l\'inscription. Veuillez réessayer.');
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'preferredPayments' | 'acceptedPayments' | 'availableProducts', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
          <p className="text-gray-600 mt-2">Rejoignez le réseau DISTRI-NIGHT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de compte
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['client', 'supplier'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateField('role', role)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === role
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <span className="font-semibold">
                    {role === 'client' ? 'Client (Maquis/Bar)' : 'Fournisseur (Dépôt-vente)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="+225 XX XX XX XX XX"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Minimum 6 caractères"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Confirmez le mot de passe"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.role === 'client' ? 'Nom du maquis/bar' : 'Nom du dépôt'}
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder={formData.role === 'client' ? 'Maquis Belle Vue' : 'Dépôt du Plateau'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsable/Contact</label>
            <input
              type="text"
              value={formData.responsiblePerson}
              onChange={(e) => updateField('responsiblePerson', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nom du responsable"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Adresse précise avec localisation GPS"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horaires d'activité</label>
            <input
              type="text"
              value={formData.businessHours}
              onChange={(e) => updateField('businessHours', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ex: 18h00 - 06h00"
              required
            />
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {formData.role === 'client' ? 'Moyens de paiement préférés' : 'Moyens de paiement acceptés'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => toggleArrayField(
                    formData.role === 'client' ? 'preferredPayments' : 'acceptedPayments',
                    method.value
                  )}
                  className={`p-3 text-sm border rounded-lg transition-all ${
                    (formData.role === 'client' ? formData.preferredPayments : formData.acceptedPayments).includes(method.value)
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier-specific fields */}
          {formData.role === 'supplier' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone de couverture</label>
                <input
                  type="text"
                  value={formData.coverageZone}
                  onChange={(e) => updateField('coverageZone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Plateau, Marcory, Treichville"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Produits disponibles</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Solibra', 'Brassivoire'].map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => toggleArrayField('availableProducts', product)}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacité de livraison</label>
                <select
                  value={formData.deliveryCapacity}
                  onChange={(e) => updateField('deliveryCapacity', e.target.value as DeliveryMethod)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="motorcycle">Moto</option>
                  <option value="tricycle">Tricycle</option>
                  <option value="truck">Camion</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};