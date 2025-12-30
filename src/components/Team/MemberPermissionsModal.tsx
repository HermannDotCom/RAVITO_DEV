import React, { useState } from 'react';
import { X, Shield, CheckSquare, Square } from 'lucide-react';
import type { OrganizationMember, OrganizationType } from '../../types/team';
import { ROLE_LABELS } from '../../types/team';
import { getPagesByOrganizationType } from '../../constants/pageDefinitions';
import { getMemberDisplayName } from '../../utils/memberUtils';

interface MemberPermissionsModalProps {
  isOpen: boolean;
  member: OrganizationMember | null;
  organizationType: OrganizationType;
  onClose: () => void;
  onSave: (memberId: string, permissions: Record<string, boolean>) => Promise<void>;
}

/**
 * Modal for editing member permissions
 * Shows pages filtered by organization type
 */
export const MemberPermissionsModal: React.FC<MemberPermissionsModalProps> = ({
  isOpen,
  member,
  organizationType,
  onClose,
  onSave,
}) => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (member && isOpen) {
      // Initialize selected pages from member's current permissions
      // For now, we'll select all pages by default for active members
      const pages = getPagesByOrganizationType(organizationType, false);
      const initialPages = new Set(pages.map(p => p.id));
      setSelectedPages(initialPages);
    }
  }, [member, isOpen, organizationType]);

  if (!isOpen || !member) return null;

  const isOwner = member.role === 'owner';
  const pages = getPagesByOrganizationType(organizationType, false);
  const memberName = getMemberDisplayName(member);

  const togglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    setSelectedPages(new Set(pages.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleSave = async () => {
    if (!member) return;

    setIsSaving(true);
    setError(null);

    try {
      // Convert selected pages to permissions object
      const permissions: Record<string, boolean> = {};
      pages.forEach(page => {
        permissions[page.id] = selectedPages.has(page.id);
      });

      await onSave(member.id, permissions);
      onClose();
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Erreur lors de la sauvegarde des permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Gérer les permissions
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {memberName} - {ROLE_LABELS[member.role] || member.role}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {isOwner ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-800 font-medium">
                  Le propriétaire a accès à tous les modules par défaut
                </p>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Sélectionnez les pages accessibles pour ce membre
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAll}
                      disabled={isSaving}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAll}
                      disabled={isSaving}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                {/* Pages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {pages.map((page) => {
                    const Icon = page.icon;
                    const isSelected = selectedPages.has(page.id);
                    const isDisabled = page.exclusiveSuperAdmin;

                    return (
                      <button
                        key={page.id}
                        onClick={() => !isDisabled && togglePage(page.id)}
                        disabled={isSaving || isDisabled}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${isSaving ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 text-left flex-1">
                          {page.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Info */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note :</strong> Les pages affichées correspondent à votre type d'organisation ({
                      organizationType === 'client' ? 'Client' :
                      organizationType === 'supplier' ? 'Fournisseur' :
                      'Administrateur'
                    }). {pages.length} page{pages.length > 1 ? 's' : ''} disponible{pages.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!isOwner && (
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
