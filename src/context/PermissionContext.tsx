import React, { createContext, useContext, ReactNode } from 'react';
import { useModuleAccess } from '../hooks/useModuleAccess';
import type { InterfaceType, AvailableModule } from '../types/permissions';

interface PermissionContextType {
  hasAccess: (moduleKey: string) => boolean;
  isLoading: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
  availableModules: AvailableModule[];
  refreshPermissions: () => Promise<void>;
  error: string | null;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

interface PermissionProviderProps {
  children: ReactNode;
  interfaceType?: InterfaceType;
}

/**
 * Permission provider that wraps the app and provides permission context
 * Uses useModuleAccess hook internally to manage permissions
 */
export const PermissionProvider: React.FC<PermissionProviderProps> = ({ 
  children, 
  interfaceType 
}) => {
  const moduleAccess = useModuleAccess(interfaceType);

  const contextValue: PermissionContextType = {
    hasAccess: moduleAccess.hasAccess,
    isLoading: moduleAccess.isLoading,
    isOwner: moduleAccess.isOwner,
    isSuperAdmin: moduleAccess.isSuperAdmin,
    availableModules: moduleAccess.availableModules,
    refreshPermissions: moduleAccess.refreshPermissions,
    error: moduleAccess.error,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Hook to use permission context
 * Must be used within PermissionProvider
 */
export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return context;
};
