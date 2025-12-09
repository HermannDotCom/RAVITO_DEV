import React from 'react';

export interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-right' | 'bottom-center';
  pulse?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  position = 'bottom-right',
  pulse = false
}) => {
  const positionClasses = position === 'bottom-right' 
    ? 'right-4 bottom-20' 
    : 'left-1/2 -translate-x-1/2 bottom-20';

  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30'
    : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/30';

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-40
        ${positionClasses}
        flex items-center gap-2
        px-6 py-3
        ${variantClasses}
        text-white font-semibold
        rounded-full
        shadow-lg
        hover:shadow-xl hover:scale-105
        active:scale-95
        transition-all duration-200
        ${pulse ? 'animate-pulse' : ''}
      `}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
