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
  Clock,
  BarChart3,
  CreditCard,
  DollarSign,
  Database,
  Settings,
  HelpCircle,
  Shield
} from 'lucide-react';

export interface PageDefinition {
  id: string;
  label: string;
  icon: any;
  exclusiveSuperAdmin?: boolean;
}

// Pour CLIENT (8 pages uniquement)
export const CLIENT_PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'catalog', label: 'Catalogue', icon: ShoppingBag },
  { id: 'cart', label: 'Panier', icon: ShoppingCart },
  { id: 'orders', label: 'Mes Commandes', icon: Package },
  { id: 'treasury', label: 'Trésorerie', icon: Wallet },
  { id: 'team', label: 'Mon Équipe', icon: Users },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'profile', label: 'Mon Profil', icon: User },
];

// Pour SUPPLIER/FOURNISSEUR (11 pages uniquement)
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

// Pour ADMIN (14 pages, dont 6 exclusives Super Admin)
export const ADMIN_PAGES: PageDefinition[] = [
  { id: 'super-dashboard', label: 'Tableau de Bord', icon: BarChart3, exclusiveSuperAdmin: true },
  { id: 'analytics', label: 'Analyses', icon: BarChart3, exclusiveSuperAdmin: false },
  { id: 'users', label: 'Utilisateurs', icon: Users, exclusiveSuperAdmin: false },
  { id: 'orders', label: 'Commandes', icon: Package, exclusiveSuperAdmin: false },
  { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag, exclusiveSuperAdmin: false },
  { id: 'treasury', label: 'Trésorerie', icon: CreditCard, exclusiveSuperAdmin: false },
  { id: 'commissions', label: 'Mes Commissions', icon: Wallet, exclusiveSuperAdmin: true },
  { id: 'zones', label: 'Zones de Livraison', icon: MapPin, exclusiveSuperAdmin: false },
  { id: 'roles', label: 'Gestion des Rôles', icon: Shield, exclusiveSuperAdmin: true },
  { id: 'team', label: 'Mon Équipe', icon: Users, exclusiveSuperAdmin: true },
  { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare, exclusiveSuperAdmin: false },
  { id: 'data', label: 'Gestion des Données', icon: Database, exclusiveSuperAdmin: true },
  { id: 'settings', label: 'Paramètres', icon: Settings, exclusiveSuperAdmin: true },
];

// Pages exclusives Super Admin (ne peuvent jamais être assignées à d'autres rôles)
export const SUPER_ADMIN_EXCLUSIVE_PAGES = ['super-dashboard', 'team', 'settings', 'commissions', 'data', 'roles'];

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
