import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { PermissionAction } from '../../types/team';

interface PermissionGateProps {
  section: string;
  action: PermissionAction;
  organizationId: string | null;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  section,
  action,
  organizationId,
  children,
  fallback = null
}) => {
  const { can, isLoading } = usePermissions(organizationId);

  if (isLoading) {
    return null;
  }

  if (can(section, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
