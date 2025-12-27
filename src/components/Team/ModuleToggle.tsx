import React from 'react';
import type { AvailableModule } from '../../types/permissions';

interface ModuleToggleProps {
  module: AvailableModule;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
  isAlwaysAccessible: boolean;
  isLoading?: boolean;
}

/**
 * Toggle switch component for individual module permissions
 * Shows module name, icon and toggle switch
 */
export const ModuleToggle: React.FC<ModuleToggleProps> = ({
  module,
  enabled,
  onChange,
  disabled,
  isAlwaysAccessible,
  isLoading = false,
}) => {
  const handleToggle = () => {
    if (!disabled && !isAlwaysAccessible) {
      onChange(!enabled);
    }
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
      title={module.description || module.name}
    >
      <div className="flex items-center space-x-3 flex-1">
        {module.icon && (
          <span className="text-2xl" role="img" aria-label={module.name}>
            {module.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {module.name}
          </p>
          {isAlwaysAccessible && (
            <p className="text-xs text-gray-500">Toujours accessible</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isAlwaysAccessible || isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          ${enabled ? 'bg-orange-600' : 'bg-gray-200'}
          ${disabled || isAlwaysAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${module.name}`}
      >
        {isLoading ? (
          <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform">
            <svg className="animate-spin h-4 w-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : (
          <span
            className={`
              ${enabled ? 'translate-x-6' : 'translate-x-1'}
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            `}
          />
        )}
      </button>
    </div>
  );
};
