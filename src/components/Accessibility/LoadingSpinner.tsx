import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Chargement en cours"
    >
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
};
