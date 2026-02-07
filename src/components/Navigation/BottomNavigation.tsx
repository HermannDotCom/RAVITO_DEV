import React from 'react';
import { User, Users, MessageSquare, CreditCard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
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
        flex-1 min-w-0 h-full px-1
        transition-all duration-200
        ${isActive
          ? 'text-orange-600'
          : 'text-gray-400 active:text-gray-600'
        }
      `}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative py-1">
        {/* Active background */}
        {isActive && (
          <div className="absolute -inset-2 bg-orange-100 rounded-xl -z-10" />
        )}

        {/* Icon */}
        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />

        {/* Badge notification */}
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span className={`text-xs mt-0.5 font-medium leading-tight truncate max-w-full ${isActive ? 'font-semibold' : ''}`}>
        {item.label}
      </span>
    </button>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const { user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    if (user.role === 'client') {
      return [
        { id: 'activity', icon: ClipboardList, label: 'Activité' },
        { id: 'ravito-gestion-subscription', icon: CreditCard, label: 'Abonnement' },
        { id: 'team', icon: Users, label: 'Équipe' },
        { id: 'support', icon: MessageSquare, label: 'Support' },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    }

    if (user.role === 'supplier') {
      return [
        { id: 'team', icon: Users, label: 'Équipe' },
        { id: 'support', icon: MessageSquare, label: 'Support' },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden safe-area-bottom">
      <div className="flex items-stretch justify-between h-16 sm:h-[72px] px-1 sm:px-2">
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
