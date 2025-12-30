import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import type { OrganizationMember, OrganizationType } from '../../types/team';
import { getPagesByOrganizationType, getAllAdminPages } from '../../constants/pageDefinitions';

interface MemberPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember;
  organizationType: OrganizationType;
  onSave: (memberId: string, allowedPages: string[]) => Promise<boolean>;
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get pages based on organization type
  const availablePages = organizationType === 'admin' && member.role === 'super_admin'
    ? getAllAdminPages()
    : getPagesByOrganizationType(organizationType);

  // Initialize selected pages from member's allowedPages
  useEffect(() => {
    if (isOpen) {
      setSelectedPages(new Set(member.allowedPages || []));
      setError(null);
    }
  }, [isOpen, member.allowedPages]);

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

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const success = await onSave(member.id, Array.from(selectedPages));
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

          {/* Content - Page Grid */}
          <div className="px-6 py-6">
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
