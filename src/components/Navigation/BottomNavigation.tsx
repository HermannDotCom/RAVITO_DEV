import React from 'react';
import { Home, ShoppingBag, ShoppingCart, Wallet, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const { cart } = useCart();

  const navItems = [
    { id: 'orders', label: 'Accueil', icon: Home },
    { id: 'catalog', label: 'Catalogue', icon: ShoppingBag },
    { id: 'cart', label: 'Panier', icon: ShoppingCart, badge: cart.length },
    { id: 'treasury', label: 'Trésorerie', icon: Wallet },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-2 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-orange-600'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                isActive ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
