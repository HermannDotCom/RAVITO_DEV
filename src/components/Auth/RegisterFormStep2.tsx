import React, { useState } from 'react';
import { Building, Warehouse, MapPin, Beer, Wine, Utensils, Hotel, Music, Map } from 'lucide-react';
import { RegistrationData } from '../../hooks/useRegistrationForm';
import { ZoneSelector } from '../Client/ZoneSelector';

interface RegisterFormStep2Props {
  data: RegistrationData;
  errors: Record<string, string>;
  updateField: (field: keyof RegistrationData, value: string | boolean | string[]) => void;
  setErrors: (errors: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const RegisterFormStep2: React.FC<RegisterFormStep2Props> = ({
  data,
  errors,
  updateField,
  setErrors,
  onNext,
  onBack
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const establishmentTypes = [
    { value: 'maquis', label: 'Maquis', icon: Beer },
    { value: 'bar', label: 'Bar', icon: Wine },
    { value: 'restaurant', label: 'Restaurant', icon: Utensils },
    { value: 'hotel', label: 'Hôtel', icon: Hotel },
    { value: 'nightclub', label: 'Boîte de nuit', icon: Music },
    { value: 'other', label: 'Autre', icon: Map }
  ];

  const handleBlur = (field: keyof RegistrationData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof RegistrationData) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'businessName':
        if (!data.businessName.trim()) {
          newErrors.businessName = 'Le nom de l\'établissement est requis';
        } else {
          delete newErrors.businessName;
        }
        break;
      case 'establishmentType':
        if (data.role === 'client' && !data.establishmentType) {
          newErrors.establishmentType = 'Le type d\'établissement est requis';
        } else {
          delete newErrors.establishmentType;
        }
        break;
      case 'zoneId':
        // Le champ zoneId n'est plus obligatoire pour l'inscription client
        delete newErrors.zoneId;
        break;
      case 'zones':
        // Le champ zones n'est plus obligatoire pour l'inscription fournisseur
        delete newErrors.zones;
        break;
      case 'address':
        if (!data.address.trim()) {
          newErrors.address = 'L\'adresse est requise';
        } else {
          delete newErrors.address;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      businessName: true,
      establishmentType: true,

      zones: true,
      address: true
    });

    // Validate all fields
    const newErrors: Record<string, string> = {};

    if (!data.businessName.trim()) {
      newErrors.businessName = 'Le nom de l\'établissement est requis';
    }

    if (data.role === 'client') {
      if (!data.establishmentType) {
        newErrors.establishmentType = 'Le type d\'établissement est requis';
      }
      // if (!data.zoneId) {
      //   newErrors.zoneId = 'La zone de livraison est requise';
      // }
    }

    // Les zones ne sont plus requises pour l'inscription des fournisseurs
    // Ils pourront les configurer plus tard dans leur profil

    if (!data.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    setErrors(newErrors);

    // If no errors, proceed to next step
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const toggleZone = (zoneId: string) => {
    const currentZones = data.zones || [];
    const newZones = currentZones.includes(zoneId)
      ? currentZones.filter(id => id !== zoneId)
      : [...currentZones, zoneId];
    updateField('zones', newZones);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {data.role === 'client' ? 'Nom de l\'établissement' : 'Nom du dépôt'} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          {data.role === 'client' ? (
            <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          ) : (
            <Warehouse className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          )}
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            onBlur={() => handleBlur('businessName')}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-300 ${
              touched.businessName && errors.businessName
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            }`}
            placeholder={data.role === 'client' ? 'Ex: Maquis Chez Tantie' : 'Ex: Dépôt Central Marcory'}
          />
        </div>
        {touched.businessName && errors.businessName && (
          <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
        )}
      </div>

      {/* Establishment Type (for clients only) */}
      {data.role === 'client' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type d'établissement <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {establishmentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    updateField('establishmentType', type.value);
                    handleBlur('establishmentType');
                  }}
                  className={`p-4 border-2 rounded-xl text-center transition-all duration-300 ${
                    data.establishmentType === type.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-105'
                      : 'border-gray-200 hover:border-orange-300 hover:shadow'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium block">{type.label}</span>
                </button>
              );
            })}
          </div>
          {touched.establishmentType && errors.establishmentType && (
            <p className="mt-1 text-sm text-red-600">{errors.establishmentType}</p>
          )}
        </div>
      )}

      {/* Zone Selection removed - Suppliers can configure zones later in their profile */}

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {data.role === 'client' ? 'Adresse complète' : 'Adresse du dépôt'} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <textarea
            value={data.address}
            onChange={(e) => updateField('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            rows={3}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-300 resize-none ${
              touched.address && errors.address
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            }`}
            placeholder="Quartier, rue, repères..."
          />
        </div>
        {touched.address && errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all"
        >
          ← Retour
        </button>
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-lg hover:shadow-xl"
        >
          Continuer →
        </button>
      </div>
    </form>
  );
};
