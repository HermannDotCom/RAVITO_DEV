import React from 'react';

export interface KenteLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const KenteLoader: React.FC<KenteLoaderProps> = ({ 
  size = 'md', 
  text 
}) => {
  const sizeConfig = {
    sm: {
      height: 'h-6', // 24px
      width: 'w-1', // 4px per bar
      gap: 'gap-1'
    },
    md: {
      height: 'h-10', // 40px
      width: 'w-1.5', // 6px per bar
      gap: 'gap-1.5'
    },
    lg: {
      height: 'h-16', // 64px
      width: 'w-2', // 8px per bar
      gap: 'gap-2'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`flex ${config.gap} ${config.height} items-end`}>
        <div 
          className={`${config.width} ${config.height} bg-orange-500 rounded-full animate-kente-weave`}
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className={`${config.width} ${config.height} bg-emerald-500 rounded-full animate-kente-weave`}
          style={{ animationDelay: '150ms' }}
        />
        <div 
          className={`${config.width} ${config.height} bg-amber-500 rounded-full animate-kente-weave`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-600 font-medium">
          {text}
        </p>
      )}
    </div>
  );
};
