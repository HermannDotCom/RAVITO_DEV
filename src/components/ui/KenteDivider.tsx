import React from 'react';

export interface KenteDividerProps {
  className?: string;
  variant?: 'full' | 'centered' | 'left';
}

export const KenteDivider: React.FC<KenteDividerProps> = ({ 
  className = '', 
  variant = 'full' 
}) => {
  const variantConfig = {
    full: 'w-full',
    centered: 'w-3/5 mx-auto',
    left: 'w-[30%]'
  };

  return (
    <div 
      className={`h-[3px] rounded-full ${variantConfig[variant]} ${className}`}
      style={{
        background: 'linear-gradient(90deg, #F97316, #10B981, #F59E0B)'
      }}
    />
  );
};
