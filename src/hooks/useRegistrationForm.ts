import { useState, useCallback } from 'react';
import { UserRole } from '../types';

export interface RegistrationData {
  // Étape 1 - Compte
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Étape 2 - Établissement
  businessName: string;
  establishmentType: string;
  zoneId: string;
  zones: string[]; // Pour fournisseurs (multi-zones)
  address: string;
  
  // Étape 3 - Confirmation
  acceptCGU: boolean;
  acceptNewsletter: boolean;
}

export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RegistrationData>({
    role: 'client',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    establishmentType: '',
    zoneId: '',
    zones: [],
    address: '',
    acceptCGU: false,
    acceptNewsletter: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateField = useCallback((field: keyof RegistrationData, value: string | boolean | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, []);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.min(Math.max(step, 1), 3));
  }, []);
  
  return {
    currentStep,
    data,
    errors,
    updateField,
    setErrors,
    nextStep,
    prevStep,
    goToStep,
    totalSteps: 3,
  };
};
