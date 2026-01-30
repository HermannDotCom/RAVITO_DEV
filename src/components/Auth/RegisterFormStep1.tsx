import React, { useState } from 'react';
import { User, Mail, Lock, Phone, Store, Truck, Eye, EyeOff, CheckCircle2, Users } from 'lucide-react';
import { RegistrationData } from '../../hooks/useRegistrationForm';
import { validateFullName, validateEmail, validatePhoneCI, validatePassword, formatPhoneCI } from '../../utils/validations';
import { useSalesRepresentatives } from '../../hooks/useSalesRepresentatives';

interface RegisterFormStep1Props {
  data: RegistrationData;
  errors: Record<string, string>;
  updateField: (field: keyof RegistrationData, value: string | boolean | string[]) => void;
  setErrors: (errors: Record<string, string>) => void;
  onNext: () => void;
}

export const RegisterFormStep1: React.FC<RegisterFormStep1Props> = ({
  data,
  errors,
  updateField,
  setErrors,
  onNext
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { salesReps, isLoading: isLoadingSalesReps } = useSalesRepresentatives();

  const handleBlur = (field: keyof RegistrationData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof RegistrationData) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'fullName': {
        const validation = validateFullName(data.fullName);
        if (!validation.isValid) {
          newErrors.fullName = validation.error;
        } else {
          delete newErrors.fullName;
        }
        break;
      }
      case 'phone': {
        const validation = validatePhoneCI(data.phone);
        if (!validation.isValid) {
          newErrors.phone = validation.error;
        } else {
          delete newErrors.phone;
        }
        break;
      }
      case 'email': {
        const validation = validateEmail(data.email);
        if (!validation.isValid) {
          newErrors.email = validation.error;
        } else {
          delete newErrors.email;
        }
        break;
      }
      case 'password': {
        const validation = validatePassword(data.password);
        if (!validation.isValid) {
          newErrors.password = validation.errors.join(', ');
        } else {
          delete newErrors.password;
        }
        break;
      }
      case 'confirmPassword': {
        if (data.password !== data.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      }
    }

    setErrors(newErrors);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneCI(value);
    updateField('phone', formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const newErrors: Record<string, string> = {};

    const nameValidation = validateFullName(data.fullName);
    if (!nameValidation.isValid) newErrors.fullName = nameValidation.error;

    const phoneValidation = validatePhoneCI(data.phone);
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.error;

    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.errors.join(', ');

    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);

    // If no errors, proceed to next step
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const passwordStrength = validatePassword(data.password);
  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;

  const getFieldClasses = (field: string) => {
    const hasError = touched[field] && errors[field];
    return `w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-300 ${
      hasError
        ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
    }`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type de compte <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField('role', 'client')}
            className={`p-4 border-2 rounded-xl text-center transition-all duration-300 ${
              data.role === 'client'
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-105'
                : 'border-gray-200 hover:border-orange-300 hover:shadow'
            }`}
          >
            <Store className="h-6 w-6 mx-auto mb-2" />
            <span className="font-semibold block">Client</span>
            <span className="text-xs opacity-75">Maquis / Bar / Restaurant</span>
          </button>
          <button
            type="button"
            onClick={() => updateField('role', 'supplier')}
            className={`p-4 border-2 rounded-xl text-center transition-all duration-300 ${
              data.role === 'supplier'
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-105'
                : 'border-gray-200 hover:border-orange-300 hover:shadow'
            }`}
          >
            <Truck className="h-6 w-6 mx-auto mb-2" />
            <span className="font-semibold block">Fournisseur</span>
            <span className="text-xs opacity-75">Dépôt-vente</span>
          </button>
        </div>
      </div>

      {/* Sales Representative Selector - Only show if there are active sales reps */}
      {!isLoadingSalesReps && salesReps.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commercial qui vous inscrit <span className="text-gray-400">(optionnel)</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={data.registeredBySalesRepId || ''}
              onChange={(e) => updateField('registeredBySalesRepId', e.target.value || undefined)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none cursor-pointer"
            >
              <option value="">Inscription directe (sans commercial)</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}{rep.zone?.name ? ` - ${rep.zone.name}` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Sélectionnez le commercial qui vous aide à vous inscrire, si applicable
          </p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            className={getFieldClasses('fullName')}
            placeholder="Prénom et Nom"
          />
        </div>
        {touched.fullName && errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-3 flex items-center">
            <span className="text-base mr-1">🇨🇮</span>
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`w-full pl-16 pr-4 py-3 border rounded-xl transition-all duration-300 ${
              touched.phone && errors.phone
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            }`}
            placeholder="07 XX XX XX XX"
          />
        </div>
        {touched.phone && errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={data.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={getFieldClasses('email')}
            placeholder="email@exemple.com"
          />
        </div>
        {touched.email && errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={data.password}
            onChange={(e) => updateField('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={getFieldClasses('password')}
            placeholder="Minimum 8 caractères"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {touched.password && errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
        
        {/* Password Strength Indicator */}
        {data.password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index <= passwordStrength.score ? passwordStrength.color : '#E5E7EB'
                  }}
                />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: passwordStrength.color }}>
              {passwordStrength.label}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={data.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={getFieldClasses('confirmPassword')}
            placeholder="Confirmez le mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {touched.confirmPassword && errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
        {passwordsMatch && (
          <div className="mt-2 flex items-center text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Les mots de passe correspondent
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-lg hover:shadow-xl"
      >
        Continuer →
      </button>
    </form>
  );
};
