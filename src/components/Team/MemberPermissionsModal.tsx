import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Info } from 'lucide-react';
import type { OrganizationMember, OrganizationType, CustomRole } from '../../types/team';
import { getPagesByOrganizationType, getAllAdminPages } from '../../constants/pageDefinitions';
import { getCustomRoles } from '../../services/roleService';

interface MemberPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember;
  organizationType: OrganizationType;
  onSave: (memberId: string, allowedPages: string[], roleUpdates?: { role?: string; customRoleId?: string | null }) => Promise<boolean>;
}

/**
 * Modal dédié à l'édition des permissions d'un membre
 * Affiche uniquement les pages correspondant au type d'organisation
 */
export const MemberPermissionsModal: React.FC<MemberPermissionsModalProps> = ({
  isOpen,
  onClose,
  member,
  organizationType,
  onSave,
}) => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get pages based on organization type
  const availablePages = organizationType === 'admin' && member.role === 'super_admin'
    ? getAllAdminPages()
    : getPagesByOrganizationType(organizationType);

  // Load available roles when modal opens
  useEffect(() => {
    const loadRoles = async () => {
      if (!isOpen) return;
      
      setIsLoadingRoles(true);
      try {
        const roles = await getCustomRoles(organizationType);
        setAvailableRoles(roles);
      } catch (err) {
        console.error('Error loading roles:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadRoles();
  }, [isOpen, organizationType]);

  // Initialize selected pages and role from member's data
  useEffect(() => {
    if (isOpen) {
      setSelectedPages(new Set(member.allowedPages || []));
      setSelectedRoleId(member.customRoleId || null);
      setError(null);
    }
  }, [isOpen, member.allowedPages, member.customRoleId]);

  if (!isOpen) return null;

  const handleTogglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(availablePages.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId || null);
    
    // Update pages based on role's allowed pages
    if (roleId) {
      const role = availableRoles.find(r => r.id === roleId);
      if (role) {
        setSelectedPages(new Set(role.allowedPages || []));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Find selected role to get its role_key
      const selectedRole = selectedRoleId ? availableRoles.find(r => r.id === selectedRoleId) : null;
      
      const roleUpdates = selectedRoleId ? {
        role: selectedRole?.roleKey || 'member',
        customRoleId: selectedRoleId
      } : undefined;

      const success = await onSave(member.id, Array.from(selectedPages), roleUpdates);
      if (success) {
        onClose();
      } else {
        setError('Erreur lors de la sauvegarde des permissions');
      }
    } catch (err) {
      setError('Une erreur est survenue');
      console.error('Error saving permissions:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Permissions - {member.email}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez les modules auxquels ce membre peut accéder
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                disabled={isSaving}
              >
                Tout sélectionner
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                disabled={isSaving}
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRoleId || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={isSaving || isLoadingRoles}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner un rôle...</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))}
              </select>
              {selectedRoleId && (
                <p className="text-sm text-gray-500 mt-1">
                  {availableRoles.find(r => r.id === selectedRoleId)?.description}
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200 mb-6" />

            {/* Pages Section Header */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Pages autorisées
              </h3>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  Les pages cochées sont héritées du rôle sélectionné. Vous pouvez personnaliser en cochant/décochant.
                </p>
              </div>
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {availablePages.map((page) => {
                const Icon = page.icon;
                const isSelected = selectedPages.has(page.id);

                return (
                  <button
                    key={page.id}
                    onClick={() => handleTogglePage(page.id)}
                    disabled={isSaving}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="font-medium text-sm text-gray-900">
                      {page.label}
                    </div>
                    {page.exclusiveSuperAdmin && (
                      <div className="text-xs text-purple-600 mt-1">
                        Super Admin uniquement
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info message */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Les permissions affichées correspondent au type d'organisation{' '}
                <span className="font-semibold">
                  {organizationType === 'client' ? 'Client' : organizationType === 'supplier' ? 'Fournisseur' : 'Admin'}
                </span>.
                {organizationType === 'client' && ' (8 pages disponibles)'}
                {organizationType === 'supplier' && ' (11 pages disponibles)'}
                {organizationType === 'admin' && member.role === 'super_admin' && ' (12 pages disponibles pour Super Admin)'}
                {organizationType === 'admin' && member.role !== 'super_admin' && ' (8 pages disponibles, 4 réservées Super Admin)'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
