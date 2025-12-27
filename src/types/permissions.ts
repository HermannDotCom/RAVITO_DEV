// Types pour le système de permissions par module

export type InterfaceType = 'supplier' | 'client' | 'admin';

export interface AvailableModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  interface: InterfaceType;
  isOwnerOnly: boolean;
  isSuperAdminOnly: boolean;
  isAlwaysAccessible: boolean;
  displayOrder: number;
}

export interface UserModulePermission {
  id: string;
  organizationId: string;
  userId: string;
  moduleKey: string;
  hasAccess: boolean;
  assignedBy: string | null;
  assignedAt: Date;
  updatedAt: Date;
}

export interface ModulePermissionWithDetails extends UserModulePermission {
  module: AvailableModule;
}

// Pour l'affectation des permissions
export interface PermissionAssignment {
  userId: string;
  moduleKey: string;
  hasAccess: boolean;
}

// Pour le hook useModuleAccess
export interface ModuleAccessState {
  permissions: Map<string, boolean>;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  isSuperAdmin: boolean;
}

// Pour la gestion des permissions d'équipe
export interface TeamMemberWithPermissions {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'owner' | 'manager' | 'employee' | 'driver';
  permissions: UserModulePermission[];
}

export interface PermissionUpdate {
  moduleKey: string;
  enabled: boolean;
}
