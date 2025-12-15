import React, { useState } from 'react';
import { Mail, Phone, Building, MapPin, Store, Truck, Edit2, Loader2 } from 'lucide-react';
import { RegistrationData } from '../../hooks/useRegistrationForm';

interface RegisterFormStep3Props {
  data: RegistrationData;
  errors: Record<string, string>;
  updateField: (field: keyof RegistrationData, value: string | boolean | string[]) => void;
  setErrors: (errors: Record<string, string>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  onEditStep: (step: number) => void;
  isLoading?: boolean;
}

export const RegisterFormStep3: React.FC<RegisterFormStep3Props> = ({
  data,
  errors,
  updateField,
  setErrors,
  onBack,
  onSubmit,
  onEditStep,
  isLoading = false
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const establishmentTypeLabels: Record<string, string> = {
    maquis: '🍺 Maquis',
    bar: '🍸 Bar',
    restaurant: '🍽️ Restaurant',
    hotel: '🏨 Hôtel',
    nightclub: '🎉 Boîte de nuit',
    other: '📍 Autre'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark CGU as touched
    setTouched({ acceptCGU: true });

    // Validate CGU acceptance
    const newErrors: Record<string, string> = {};

    if (!data.acceptCGU) {
      newErrors.acceptCGU = 'Vous devez accepter les Conditions Générales d\'Utilisation';
    }

    setErrors(newErrors);

    // If no errors, submit
    if (Object.keys(newErrors).length === 0) {
      await onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Information Card */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Informations du compte</h3>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Modifier
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {data.role === 'client' ? (
              <Store className="h-5 w-5 text-gray-600 mt-0.5" />
            ) : (
              <Truck className="h-5 w-5 text-gray-600 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-gray-600">Type de compte</p>
              <p className="font-medium text-gray-900">
                {data.role === 'client' ? 'Client' : 'Fournisseur'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium text-gray-900">{data.fullName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="font-medium text-gray-900">🇨🇮 +225 {data.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{data.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Establishment Information Card */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Établissement</h3>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Modifier
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {data.role === 'client' ? 'Nom de l\'établissement' : 'Nom du dépôt'}
              </p>
              <p className="font-medium text-gray-900">{data.businessName}</p>
            </div>
          </div>
          {data.role === 'client' && data.establishmentType && (
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium text-gray-900">
                  {establishmentTypeLabels[data.establishmentType] || data.establishmentType}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {data.role === 'client' ? 'Zone de livraison' : 'Zones desservies'}
              </p>
              <p className="font-medium text-gray-900">
                {data.role === 'client' 
                  ? (data.zoneId || 'Non spécifiée')
                  : (data.zones.length > 0 ? `${data.zones.length} zone(s)` : 'Aucune zone')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Adresse</p>
              <p className="font-medium text-gray-900">{data.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CGU Checkbox */}
      <div className="space-y-4">
        <div className={`border-2 rounded-xl p-4 transition-all ${
          touched.acceptCGU && errors.acceptCGU
            ? 'border-red-500 bg-red-50'
            : 'border-gray-200'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.acceptCGU}
              onChange={(e) => {
                updateField('acceptCGU', e.target.checked);
                setTouched(prev => ({ ...prev, acceptCGU: true }));
              }}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 transition-colors"
            />
            <span className="text-sm text-gray-700">
              J'accepte les{' '}
              <a
                href="/cgu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 font-medium underline"
              >
                Conditions Générales d'Utilisation
              </a>{' '}
              et la{' '}
              <a
                href="/cgu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 font-medium underline"
              >
                Politique de Confidentialité
              </a>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
        {touched.acceptCGU && errors.acceptCGU && (
          <p className="text-sm text-red-600">{errors.acceptCGU}</p>
        )}

        {/* Newsletter Checkbox (optional) */}
        <div className="border-2 border-gray-200 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.acceptNewsletter}
              onChange={(e) => updateField('acceptNewsletter', e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 transition-colors"
            />
            <span className="text-sm text-gray-700">
              Je souhaite recevoir les actualités et offres de RAVITO par email
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Retour
        </button>
        <button
          type="submit"
          disabled={!data.acceptCGU || isLoading}
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </div>
    </form>
  );
};
