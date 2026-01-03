// ============================================
// TEAM MANAGEMENT TYPES
// ============================================

// Enums
export type OrganizationType = 'client' | 'supplier' | 'admin';
export type MemberStatus = 'pending' | 'active' | 'inactive';
export type MemberRole = 
  // Client roles
  | 'owner'
  | 'manager' 
  | 'employee'
  // Supplier roles
  | 'driver'
  // Admin roles
  | 'super_admin'
  | 'administrator'
  | 'support'
  | 'analyst'
  | 'catalog_manager'
  | 'zone_manager';

// Page IDs
export type PageId = string;

// Page definitions by organization type
export type ClientPageId = 
  | 'dashboard'
  | 'catalog'
  | 'cart'
  | 'orders'
  | 'profile'
  | 'treasury'
  | 'team'
  | 'support';

export type SupplierPageId = 
  | 'dashboard'
  | 'delivery-mode'
  | 'orders'
  | 'deliveries'
  | 'treasury'
  | 'zones'
  | 'pricing'
  | 'team'
  | 'history'
  | 'support'
  | 'profile';

export type AdminPageId =
  | 'analytics'
  | 'users'
  | 'orders'
  | 'products'
  | 'pricing'
  | 'treasury'
  | 'commissions'
  | 'zones'
  | 'team'
  | 'roles'
  | 'tickets'
  | 'data'
  | 'settings';

// Interfaces
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  ownerId: string;
  maxMembers: number;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string | null;
  email: string;
  role: MemberRole;
  permissions: Permissions;
  status: MemberStatus;
  invitationToken: string | null;
  invitedAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // New fields for refactored system
  customRoleId?: string | null;
  isActive: boolean;
  allowedPages?: string[];
  passwordSetByOwner?: boolean;
  lastLoginAt?: Date | null;
  loginCount?: number;
}

export interface MemberWithProfile extends OrganizationMember {
  profile?: {
    fullName: string;
    phone: string | null;
    avatar?: string | null;
  };
}

export interface RolePermission {
  id: string;
  organizationType: OrganizationType;
  roleName: MemberRole;
  displayName: string;
  description: string;
  permissions: Permissions;
  createdAt: Date;
  updatedAt: Date;
}

// New interface for custom roles
export interface CustomRole {
  id: string;
  organizationType: OrganizationType;
  roleKey: string;
  displayName: string;
  description: string;
  allowedPages: string[];
  isSystemRole: boolean;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permissions {
  catalog?: SectionPermissions;
  orders?: SectionPermissions;
  treasury?: TreasuryPermissions;
  team?: TeamPermissions;
  settings?: SettingsPermissions;
  zones?: SectionPermissions;
  deliveries?: DeliveryPermissions;
  analytics?: AnalyticsPermissions;
  users?: SectionPermissions;
  products?: SectionPermissions;
  support?: SupportPermissions;
}

export interface SectionPermissions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface TreasuryPermissions {
  view?: boolean;
  manage?: boolean;
}

export interface TeamPermissions {
  view?: boolean;
  invite?: boolean;
  remove?: boolean;
  edit?: boolean;
}

export interface SettingsPermissions {
  view?: boolean;
  edit?: boolean;
}

export interface DeliveryPermissions {
  view?: boolean;
  manage?: boolean;
}

export interface AnalyticsPermissions {
  view?: boolean;
}

export interface SupportPermissions {
  view?: boolean;
  manage?: boolean;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage' | 'invite' | 'remove';

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  maxMembers: number;
  availableSlots: number;
}

// Constants
export const ROLE_LABELS: Record<MemberRole, string> = {
  // Client roles
  owner: 'Propriétaire',
  manager: 'Gérant',
  employee: 'Employé',
  // Supplier roles
  driver: 'Livreur',
  // Admin roles
  super_admin: 'Super Admin',
  administrator: 'Administrateur',
  support: 'Support',
  analyst: 'Analyste',
  catalog_manager: 'Gestionnaire Catalogue',
  zone_manager: 'Gestionnaire Zones'
};

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  // Client roles
  owner: 'Propriétaire du compte avec tous les droits',
  manager: 'Gestion des commandes et du catalogue',
  employee: 'Consultation et création de commandes',
  // Supplier roles
  driver: 'Gestion des livraisons en cours',
  // Admin roles
  super_admin: 'Administrateur avec tous les droits',
  administrator: 'Gestion quotidienne de la plateforme',
  support: 'Assistance utilisateur et tickets',
  analyst: 'Rapports et statistiques',
  catalog_manager: 'Produits et prix de référence',
  zone_manager: 'Zones de livraison'
};

export const ROLES_BY_ORG_TYPE: Record<OrganizationType, MemberRole[]> = {
  client: ['owner', 'manager', 'employee'],
  supplier: ['owner', 'manager', 'driver'],
  admin: ['super_admin', 'administrator', 'support', 'analyst', 'catalog_manager', 'zone_manager']
};

export const MAX_MEMBERS_BY_TYPE: Record<OrganizationType, number> = {
  client: 2,
  supplier: 2,
  admin: 40  // Updated from 5 to 40
};

// Role colors for badges
export const ROLE_COLORS: Record<MemberRole, string> = {
  // Client roles
  owner: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
  // Supplier roles
  driver: 'bg-yellow-100 text-yellow-800',
  // Admin roles
  super_admin: 'bg-red-100 text-red-800',
  administrator: 'bg-orange-100 text-orange-800',
  support: 'bg-teal-100 text-teal-800',
  analyst: 'bg-indigo-100 text-indigo-800',
  catalog_manager: 'bg-pink-100 text-pink-800',
  zone_manager: 'bg-cyan-100 text-cyan-800'
};

// Status colors for badges
export const STATUS_COLORS: Record<MemberStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  pending: 'En attente',
  active: 'Actif',
  inactive: 'Inactif'
};

// Page definitions
export interface PageDefinition {
  id: string;
  label: string;
  moduleKey: string;
  exclusiveSuperAdmin?: boolean;
}

export const CLIENT_PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Accueil', moduleKey: 'dashboard' },
  { id: 'catalog', label: 'Catalogue', moduleKey: 'catalog' },
  { id: 'cart', label: 'Panier', moduleKey: 'cart' },
  { id: 'orders', label: 'Mes Commandes', moduleKey: 'orders' },
  { id: 'profile', label: 'Mon Profil', moduleKey: 'profile' },
  { id: 'treasury', label: 'Trésorerie', moduleKey: 'treasury' },
  { id: 'team', label: 'Mon Équipe', moduleKey: 'team' },
  { id: 'support', label: 'Support', moduleKey: 'support' }
];

export const SUPPLIER_PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Accueil', moduleKey: 'dashboard' },
  { id: 'delivery-mode', label: 'Mode Livreur', moduleKey: 'deliveries' },
  { id: 'orders', label: 'Commandes', moduleKey: 'orders' },
  { id: 'deliveries', label: 'Livraisons', moduleKey: 'deliveries' },
  { id: 'treasury', label: 'Revenus', moduleKey: 'treasury' },
  { id: 'zones', label: 'Mes Zones', moduleKey: 'zones' },
  { id: 'pricing', label: 'Produits vendus', moduleKey: 'pricing' },
  { id: 'team', label: 'Mon Équipe', moduleKey: 'team' },
  { id: 'history', label: 'Historique', moduleKey: 'history' },
  { id: 'support', label: 'Support', moduleKey: 'support' },
  { id: 'profile', label: 'Mon Profil', moduleKey: 'profile' }
];

export const ADMIN_PAGES: PageDefinition[] = [
  { id: 'analytics', label: 'Analyses', moduleKey: 'analytics', exclusiveSuperAdmin: false },
  { id: 'users', label: 'Utilisateurs', moduleKey: 'users', exclusiveSuperAdmin: false },
  { id: 'orders', label: 'Commandes', moduleKey: 'orders', exclusiveSuperAdmin: false },
  { id: 'products', label: 'Catalogue Produits', moduleKey: 'products', exclusiveSuperAdmin: false },
  { id: 'pricing', label: 'Prix de Référence', moduleKey: 'pricing', exclusiveSuperAdmin: false },
  { id: 'treasury', label: 'Trésorerie', moduleKey: 'treasury', exclusiveSuperAdmin: false },
  { id: 'commissions', label: 'Mes Commissions', moduleKey: 'commissions', exclusiveSuperAdmin: true },
  { id: 'zones', label: 'Zones de Livraison', moduleKey: 'zones', exclusiveSuperAdmin: false },
  { id: 'roles', label: 'Gestion des Rôles', moduleKey: 'roles', exclusiveSuperAdmin: true },
  { id: 'tickets', label: 'Support & Tickets', moduleKey: 'tickets', exclusiveSuperAdmin: false },
  { id: 'data', label: 'Gestion des Données', moduleKey: 'data', exclusiveSuperAdmin: true },
  { id: 'settings', label: 'Paramètres', moduleKey: 'settings', exclusiveSuperAdmin: true }
];

export const PAGES_BY_ORG_TYPE: Record<OrganizationType, PageDefinition[]> = {
  client: CLIENT_PAGES,
  supplier: SUPPLIER_PAGES,
  admin: ADMIN_PAGES
};

// Super Admin exclusive pages (cannot be assigned to other roles)
export const SUPER_ADMIN_EXCLUSIVE_PAGES = ['roles', 'settings', 'commissions', 'data'];
