import { 
  Home, 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  User, 
  Wallet, 
  Users, 
  MessageSquare,
  Navigation,
  Truck,
  MapPin,
  DollarSign,
  Clock,
  BarChart3,
  CreditCard,
  Database,
  Settings,
  type LucideIcon
} from 'lucide-react';
import type { OrganizationType } from '../types/team';

export interface PageDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  exclusiveSuperAdmin?: boolean;
}

/**
 * Pages available for CLIENT organizations (8 pages)
 */
export const CLIENT_PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'catalog', label: 'Catalogue', icon: ShoppingBag },
  { id: 'cart', label: 'Panier', icon: ShoppingCart },
  { id: 'orders', label: 'Mes Commandes', icon: Package },
  { id: 'profile', label: 'Mon Profil', icon: User },
  { id: 'treasury', label: 'Trésorerie', icon: Wallet },
  { id: 'team', label: 'Mon Équipe', icon: Users },
  { id: 'support', label: 'Support', icon: MessageSquare },
];

/**
 * Pages available for SUPPLIER/FOURNISSEUR organizations (11 pages)
 */
export const SUPPLIER_PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'delivery-mode', label: 'Mode Livreur', icon: Navigation },
  { id: 'orders', label: 'Commandes', icon: Package },
  { id: 'deliveries', label: 'Livraisons', icon: Truck },
  { id: 'treasury', label: 'Revenus', icon: Wallet },
  { id: 'zones', label: 'Mes Zones', icon: MapPin },
  { id: 'pricing', label: 'Produits vendus', icon: DollarSign },
  { id: 'team', label: 'Mon Équipe', icon: Users },
  { id: 'history', label: 'Historique', icon: Clock },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'profile', label: 'Mon Profil', icon: User },
];

/**
 * Pages available for ADMIN organizations (12 pages, 4 exclusive to Super Admin)
 */
export const ADMIN_PAGES: PageDefinition[] = [
  { id: 'analytics', label: 'Analyses', icon: BarChart3, exclusiveSuperAdmin: false },
  { id: 'users', label: 'Utilisateurs', icon: Users, exclusiveSuperAdmin: false },
  { id: 'orders', label: 'Commandes', icon: Package, exclusiveSuperAdmin: false },
  { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag, exclusiveSuperAdmin: false },
  { id: 'pricing', label: 'Prix de Référence', icon: DollarSign, exclusiveSuperAdmin: false },
  { id: 'treasury', label: 'Trésorerie', icon: CreditCard, exclusiveSuperAdmin: false },
  { id: 'commissions', label: 'Mes Commissions', icon: Wallet, exclusiveSuperAdmin: true },
  { id: 'zones', label: 'Zones de Livraison', icon: MapPin, exclusiveSuperAdmin: false },
  { id: 'team', label: 'Mon Équipe', icon: Users, exclusiveSuperAdmin: true },
  { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare, exclusiveSuperAdmin: false },
  { id: 'data', label: 'Gestion des Données', icon: Database, exclusiveSuperAdmin: true },
  { id: 'settings', label: 'Paramètres', icon: Settings, exclusiveSuperAdmin: true },
];

/**
 * Get pages available for a specific organization type
 * For admin, filters out super admin exclusive pages unless includeSuperAdmin is true
 */
export function getPagesByOrganizationType(
  orgType: OrganizationType,
  includeSuperAdmin: boolean = false
): PageDefinition[] {
  switch (orgType) {
    case 'client':
      return CLIENT_PAGES;
    case 'supplier':
      return SUPPLIER_PAGES;
    case 'admin':
      return includeSuperAdmin 
        ? ADMIN_PAGES 
        : ADMIN_PAGES.filter(p => !p.exclusiveSuperAdmin);
    default:
      return [];
  }
}

/**
 * Get the count of pages for a specific organization type
 */
export function getPageCountByOrganizationType(
  orgType: OrganizationType,
  includeSuperAdmin: boolean = false
): number {
  return getPagesByOrganizationType(orgType, includeSuperAdmin).length;
}
