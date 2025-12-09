import React from 'react';
import { Home, ShoppingBag, ShoppingCart, Package, Truck, Wallet, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  pendingOrdersCount?: number;
  availableOrdersCount?: number;
  activeDeliveriesCount?: number;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        w-16 h-full
        transition-all duration-200
        ${isActive 
          ? 'text-orange-600' 
          : 'text-gray-400 hover:text-gray-600'
        }
      `}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        {/* Active background */}
        {isActive && (
          <div className="absolute -inset-2 bg-orange-100 rounded-xl -z-10" />
        )}
        
        {/* Icon */}
        <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
        
        {/* Badge notification */}
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>
      
      {/* Label */}
      <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
        {item.label}
      </span>
    </button>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onSectionChange,
  pendingOrdersCount = 0,
  availableOrdersCount = 0,
  activeDeliveriesCount = 0
}) => {
  const { cart } = useCart();
  const { user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    if (user.role === 'client') {
      return [
        { id: 'dashboard', icon: Home, label: 'Accueil' },
        { id: 'catalog', icon: ShoppingBag, label: 'Catalogue' },
        { id: 'cart', icon: ShoppingCart, label: 'Panier', badge: cart.length },
        { id: 'orders', icon: Package, label: 'Commandes', badge: pendingOrdersCount },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    }

    if (user.role === 'supplier') {
      return [
        { id: 'dashboard', icon: Home, label: 'Accueil' },
        { id: 'orders', icon: Package, label: 'Commandes', badge: availableOrdersCount },
        { id: 'deliveries', icon: Truck, label: 'Livraisons', badge: activeDeliveriesCount },
        { id: 'treasury', icon: Wallet, label: 'Revenus' },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe z-50 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};
