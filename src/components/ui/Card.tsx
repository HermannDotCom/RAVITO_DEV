import React from 'react';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  onClick,
}) => {
  const baseStyles = 'bg-white rounded-2xl';

  const variantStyles = {
    default: 'shadow-sm border border-gray-100',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-200',
    interactive: 'shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
