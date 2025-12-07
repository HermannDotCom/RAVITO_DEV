import { useState, useEffect, useCallback } from 'react';
import type {
  Organization,
  OrganizationMember,
  MemberRole,
  TeamStats
} from '../types/team';
import * as teamService from '../services/teamService';
import { useAuth } from '../context/AuthContext';

interface UseTeamReturn {
  organization: Organization | null;
  members: OrganizationMember[];
  stats: TeamStats | null;
  isLoading: boolean;
  error: string | null;
  inviteMember: (email: string, role: MemberRole) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, newRole: MemberRole) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing team data and operations
 */
export const useTeam = (): UseTeamReturn => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organization data
  const loadOrganization = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const org = await teamService.getOrganization(user.id);
      setOrganization(org);

      if (org) {
        // Load members and stats
        const [membersData, statsData] = await Promise.all([
          teamService.getOrganizationMembers(org.id),
          teamService.getTeamStats(org.id)
        ]);

        setMembers(membersData);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading organization:', err);
      setError('Erreur lors du chargement de l\'équipe');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load organization on mount and when user changes
  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Invite a member
  const inviteMember = useCallback(
    async (email: string, role: MemberRole): Promise<boolean> => {
      if (!organization) {
        setError('Aucune organisation trouvée');
        return false;
      }

      setError(null);
      const result = await teamService.inviteMember(organization.id, email, role);

      if (result.success) {
        // Refresh data
        await loadOrganization();
        return true;
      } else {
        setError(result.error || 'Erreur lors de l\'invitation');
        return false;
      }
    },
    [organization, loadOrganization]
  );

  // Remove a member
  const removeMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      setError(null);
      const result = await teamService.removeMember(memberId);

      if (result.success) {
        // Refresh data
        await loadOrganization();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la suppression');
        return false;
      }
    },
    [loadOrganization]
  );

  // Update member role
  const updateMemberRole = useCallback(
    async (memberId: string, newRole: MemberRole): Promise<boolean> => {
      setError(null);
      const result = await teamService.updateMemberRole(memberId, newRole);

      if (result.success) {
        // Refresh data
        await loadOrganization();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la mise à jour');
        return false;
      }
    },
    [loadOrganization]
  );

  // Refresh function
  const refresh = useCallback(async () => {
    await loadOrganization();
  }, [loadOrganization]);

  return {
    organization,
    members,
    stats,
    isLoading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    refresh
  };
};
