import React from 'react';
import { User, Building, FileCheck } from 'lucide-react';

interface RegisterFormStepperProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const RegisterFormStepper: React.FC<RegisterFormStepperProps> = ({
  currentStep,
  totalSteps,
  onStepClick
}) => {
  const steps = [
    { number: 1, label: 'Compte', icon: User },
    { number: 2, label: 'Établissement', icon: Building },
    { number: 3, label: 'Confirmation', icon: FileCheck }
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-orange-500 text-white border-orange-500 ring-4 ring-orange-200';
      case 'upcoming':
        return 'bg-gray-200 text-gray-500 border-gray-300';
      default:
        return '';
    }
  };

  const getLineClasses = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="w-full mb-8">
      {/* Steps */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1 relative z-10">
                <button
                  onClick={() => onStepClick && onStepClick(step.number)}
                  disabled={status === 'upcoming'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getStepClasses(status)} ${
                    status === 'upcoming' ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <span className={`mt-2 text-sm font-medium ${
                  status === 'current' ? 'text-orange-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 relative -top-7">
                  <div className={`h-full rounded transition-all duration-300 ${getLineClasses(step.number)}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
