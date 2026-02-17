import React from 'react';
import { User, Users, MessageSquare, CreditCard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';

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
  const { canAccessGestionActivity, loading: subscriptionLoading } = useSubscription();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    let items: NavItem[] = [];

    if (user.role === 'client') {
      items = [
        { id: 'activity', icon: ClipboardList, label: 'Activité' },
        { id: 'ravito-gestion-subscription', icon: CreditCard, label: 'Abonnement' },
        { id: 'team', icon: Users, label: 'Équipe' },
        { id: 'support', icon: MessageSquare, label: 'Support' },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    } else if (user.role === 'supplier') {
      items = [
        { id: 'ravito-gestion-subscription', icon: CreditCard, label: 'Abonnement' },
        { id: 'team', icon: Users, label: 'Équipe' },
        { id: 'support', icon: MessageSquare, label: 'Support' },
        { id: 'profile', icon: User, label: 'Profil' },
      ];
    }

    // Non-approved users should only see "Mon Profil" and "Support"
    if (!user.isApproved && user.role !== 'admin') {
      items = items.filter(item => item.id === 'profile' || item.id === 'support');
    } else if ((user.role === 'client' || user.role === 'supplier') && !canAccessGestionActivity && !subscriptionLoading) {
      // Users without active subscription can only access "Support", "Profil" and "Abonnement"
      items = items.filter(item =>
        item.id === 'profile' ||
        item.id === 'support' ||
        item.id === 'ravito-gestion-subscription'
      );
    }

    return items;
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
