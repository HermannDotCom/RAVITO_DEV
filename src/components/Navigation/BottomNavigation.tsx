import React from 'react';
import { Home, Package, ShoppingCart, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { user } = useAuth();
  const { cart } = useCart();
  
  // Only show for client role
  if (user?.role !== 'client') {
    return null;
  }

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { id: 'orders', label: 'Accueil', icon: Home },  // Dashboard/Home
    { id: 'catalog', label: 'Catalogue', icon: Package },
    { id: 'cart', label: 'Panier', icon: ShoppingCart, badge: cartItemsCount },
    { id: 'orders', label: 'Commandes', icon: FileText },  // Orders list
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-orange-600' 
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'text-orange-600' : 'text-gray-600'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
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
