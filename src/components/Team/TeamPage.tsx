import React, { useState } from 'react';
import { Users, UserPlus, Crown, AlertCircle, RefreshCw, Mail, BarChart3, Target, DollarSign } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { usePermissions } from '../../hooks/usePermissions';
import { CreateMemberModal } from './CreateMemberModal';
import { QuotaBar } from './QuotaBar';
import { MembersTab } from './tabs/MembersTab';
import { InvitationsTab } from './tabs/InvitationsTab';
import { SalesDashboardTab } from './tabs/SalesDashboardTab';
import { SalesObjectivesTab } from './tabs/SalesObjectivesTab';
import { SalesCommissionsTab } from './tabs/SalesCommissionsTab';
import { useAuth } from '../../context/AuthContext';

type TabId = 'members' | 'invitations' | 'dashboard' | 'objectives' | 'commissions';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const TABS: Tab[] = [
  { id: 'members', label: 'Membres', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3, superAdminOnly: true },
  { id: 'objectives', label: 'Objectifs', icon: Target, superAdminOnly: true },
  { id: 'commissions', label: 'Primes', icon: DollarSign, superAdminOnly: true },
];

/**
 * Main Team Management Page - Refactored with Tabs
 */
export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const { organization, members, stats, isLoading, error, createMember, refresh } = useTeam();
  const { can } = usePermissions(organization?.id || null);
  
  const [activeTab, setActiveTab] = useState<TabId>('members');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canInvite = can('team', 'invite');
  const isOwner = organization ? organization.ownerId === user?.id : false;
  
  // Check if user is Super Admin from profiles.is_super_admin
  const isSuperAdmin = user?.isSuperAdmin === true;
  
  // Filter tabs based on role
  const availableTabs = TABS.filter(tab => !tab.superAdminOnly || isSuperAdmin);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return <MembersTab />;
      case 'invitations':
        return <InvitationsTab />;
      case 'dashboard':
        return <SalesDashboardTab />;
      case 'objectives':
        return <SalesObjectivesTab />;
      case 'commissions':
        return <SalesCommissionsTab />;
      default:
        return <MembersTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Chargement de l'équipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
              Aucune organisation trouvée
            </h3>
            <p className="text-sm sm:text-base text-yellow-800">
              Vous n'êtes pas encore membre d'une équipe. Contactez votre administrateur pour obtenir une invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Mon Équipe</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">{organization.name}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={refresh}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Actualiser</span>
            </button>

            {canInvite && activeTab === 'members' && (
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={stats?.availableSlots === 0}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Créer un membre</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Quota Bar - only show on members/invitations tabs */}
        {stats && (activeTab === 'members' || activeTab === 'invitations') && (
          <QuotaBar stats={stats} />
        )}

        {/* Upsell message if quota reached */}
        {stats && stats.availableSlots === 0 && activeTab === 'members' && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
            <Crown className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Quota atteint
              </h3>
              <p className="text-sm text-orange-800">
                Vous avez atteint le nombre maximum de membres pour votre équipe. 
                Contactez-nous pour augmenter votre quota.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors
                  ${isActive
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createMember}
        organizationType={organization.type}
        availableSlots={stats?.availableSlots || 0}
      />
    </div>
  );
};

