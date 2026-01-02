import React, { useState, useMemo } from 'react';
import { Search, Grid, List as ListIcon } from 'lucide-react';
import type { OrganizationMember, MemberRole, OrganizationType } from '../../types/team';
import { ROLE_LABELS } from '../../types/team';
import { MemberStatusBadge } from './MemberStatusBadge';
import { MemberActions } from './MemberActions';

interface MemberListViewProps {
  members: OrganizationMember[];
  organizationType: OrganizationType;
  currentUserId: string | undefined;
  canEdit: boolean;
  canRemove: boolean;
  onViewDetails: (member: OrganizationMember) => void;
  onEditPermissions: (member: OrganizationMember) => void;
  onToggleStatus: (member: OrganizationMember) => void;
  onRemove: (member: OrganizationMember) => void;
}

type ViewMode = 'list' | 'grid';
type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Vue liste/tableau des membres avec fonctionnalités de recherche et filtres
 */
export const MemberListView: React.FC<MemberListViewProps> = ({
  members,
  organizationType,
  currentUserId,
  canEdit,
  canRemove,
  onViewDetails,
  onEditPermissions,
  onToggleStatus,
  onRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'lastLogin'>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique roles from members
  const availableRoles = useMemo(() => {
    const roles = new Set<MemberRole>();
    members.forEach(m => roles.add(m.role));
    return Array.from(roles);
  }, [members]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        member.email.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && member.isActive) ||
        (statusFilter === 'inactive' && !member.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'email') {
        compareValue = a.email.localeCompare(b.email);
      } else if (sortBy === 'role') {
        compareValue = a.role.localeCompare(b.role);
      } else if (sortBy === 'lastLogin') {
        const aTime = a.lastLoginAt?.getTime() || 0;
        const bTime = b.lastLoginAt?.getTime() || 0;
        compareValue = aTime - bTime;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [members, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Jamais';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const activeCount = members.filter(m => m.isActive).length;

  if (viewMode === 'grid') {
    // Grid view would go here - for now, just show a message
    return (
      <div className="text-center py-12 text-gray-500">
        Vue grille en cours de développement
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{members.length}</span> membres • 
          <span className="font-semibold text-green-600 ml-1">{activeCount}</span> actifs
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:flex-initial lg:min-w-0">
          {/* Search */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Vue liste"
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Vue grille"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as MemberRole | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tous les profils</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  Utilisateur {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  Profil/Rôle {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastLogin')}
                >
                  Dernière connexion {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  // Dans l'interface Admin, le super_admin est l'équivalent du propriétaire
                  // Dans les interfaces Client/Supplier, c'est le rôle 'owner'
                  const isOwner = member.role === 'owner' ||
                                  (organizationType === 'admin' && member.role === 'super_admin');

                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {getInitials(member.email)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <MemberStatusBadge isActive={member.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <MemberActions
                          member={member}
                          isOwner={isOwner}
                          canEdit={canEdit && !isOwner}
                          canRemove={canRemove && !isOwner}
                          onViewDetails={onViewDetails}
                          onEditPermissions={onEditPermissions}
                          onToggleStatus={onToggleStatus}
                          onRemove={onRemove}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
