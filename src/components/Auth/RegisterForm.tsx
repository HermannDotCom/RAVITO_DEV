import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRegistrationForm } from '../../hooks/useRegistrationForm';
import { RegisterFormStepper } from './RegisterFormStepper';
import { RegisterFormStep1 } from './RegisterFormStep1';
import { RegisterFormStep2 } from './RegisterFormStep2';
import { RegisterFormStep3 } from './RegisterFormStep3';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const { register, isLoading } = useAuth();
  const {
    currentStep,
    data,
    errors,
    updateField,
    setErrors,
    nextStep,
    prevStep,
    goToStep,
    totalSteps,
  } = useRegistrationForm();
  
  const [submitError, setSubmitError] = useState('');

  const handleFinalSubmit = async () => {
    setSubmitError('');

    // Map registration data to the format expected by register()
    const registrationPayload = {
      role: data.role,
      email: data.email,
      password: data.password,
      name: data.fullName,
      phone: data.phone.replace(/\s/g, ''), // Remove spaces
      address: data.address,
      businessName: data.businessName,
      zoneId: data.role === 'client' ? data.zoneId : undefined,
    };

    const success = await register(registrationPayload);
    if (!success) {
      setSubmitError('Erreur lors de l\'inscription. Veuillez réessayer.');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/logos/logo-with-slogan.png" 
              alt="Ravito - Le ravitaillement qui ne dort jamais" 
              className="h-28 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h2>
        </div>

        {/* Stepper */}
        <RegisterFormStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepClick={(step) => {
            // Only allow going back to previous completed steps
            if (step < currentStep) {
              goToStep(step);
            }
          }}
        />

        {/* Step Content */}
        {currentStep === 1 && (
          <RegisterFormStep1
            data={data}
            errors={errors}
            updateField={updateField}
            setErrors={setErrors}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <RegisterFormStep2
            data={data}
            errors={errors}
            updateField={updateField}
            setErrors={setErrors}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <RegisterFormStep3
            data={data}
            errors={errors}
            updateField={updateField}
            setErrors={setErrors}
            onBack={prevStep}
            onSubmit={handleFinalSubmit}
            onEditStep={goToStep}
            isLoading={isLoading}
          />
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        {/* Back to Login Link */}
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