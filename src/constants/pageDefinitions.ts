import {
  User,
  Users,
  MessageSquare,
  MapPin,
  BarChart3,
  CreditCard,
  Database,
  Settings,
  Shield,
  Briefcase,
  ShoppingBag,
  ClipboardList
} from 'lucide-react';

export interface PageDefinition {
  id: string;
  label: string;
  icon: any;
  exclusiveSuperAdmin?: boolean;
}

// Pour CLIENT (5 pages uniquement - RAVITO Gestion)
export const CLIENT_PAGES: PageDefinition[] = [
  { id: 'activity', label: 'Gestion Activité', icon: ClipboardList },
  { id: 'ravito-gestion-subscription', label: 'Mon Abonnement', icon: CreditCard },
  { id: 'team', label: 'Mon Équipe', icon: Users },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'profile', label: 'Mon Profil', icon: User },
];

// Pour SUPPLIER/FOURNISSEUR (3 pages uniquement - RAVITO Gestion)
export const SUPPLIER_PAGES: PageDefinition[] = [
  { id: 'team', label: 'Mon Équipe', icon: Users },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'profile', label: 'Mon Profil', icon: User },
];

// Pour ADMIN (pages assignables + pages exclusives Super Admin - RAVITO Gestion)
export const ADMIN_PAGES: PageDefinition[] = [
  // Pages exclusives Super Admin (non assignables)
  { id: 'super-dashboard', label: 'Tableau de Bord', icon: BarChart3, exclusiveSuperAdmin: true },
  { id: 'team', label: 'Mon Équipe', icon: Users, exclusiveSuperAdmin: true },
  { id: 'roles', label: 'Gestion des Rôles', icon: Shield, exclusiveSuperAdmin: true },
  { id: 'data', label: 'Gestion des Données', icon: Database, exclusiveSuperAdmin: true },
  { id: 'settings', label: 'Paramètres', icon: Settings, exclusiveSuperAdmin: true },
  
  // Pages assignables à d'autres rôles
  { id: 'users', label: 'Utilisateurs', icon: Users, exclusiveSuperAdmin: false },
  { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag, exclusiveSuperAdmin: false },
  { id: 'zones', label: 'Zones de Livraison', icon: MapPin, exclusiveSuperAdmin: false },
  { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare, exclusiveSuperAdmin: false },
  { id: 'commercial-activity', label: 'Activité Commerciale', icon: Briefcase, exclusiveSuperAdmin: false },
  { id: 'subscription-management', label: 'Gestion Abonnements', icon: CreditCard, exclusiveSuperAdmin: false },
];

// Pages exclusives Super Admin (ne peuvent jamais être assignées à d'autres rôles)
export const SUPER_ADMIN_EXCLUSIVE_PAGES = ['super-dashboard', 'team', 'roles', 'data', 'settings'];

// Fonction pour obtenir les pages selon le type d'organisation
export function getPagesByOrganizationType(orgType: 'client' | 'supplier' | 'admin'): PageDefinition[] {
  switch (orgType) {
    case 'client': 
      return CLIENT_PAGES;
    case 'supplier': 
      return SUPPLIER_PAGES;
    case 'admin': 
      // Pour les membres Admin (non Super Admin), exclure les pages exclusives
      return ADMIN_PAGES.filter(p => !p.exclusiveSuperAdmin);
    default: 
      return [];
  }
}

// Fonction pour obtenir toutes les pages Admin (pour le Super Admin)
export function getAllAdminPages(): PageDefinition[] {
  return ADMIN_PAGES;
}
