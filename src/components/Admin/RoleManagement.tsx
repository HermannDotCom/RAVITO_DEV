import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Eye, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CustomRole, OrganizationType, PageDefinition } from '../../types/team';
import { PAGES_BY_ORG_TYPE, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../types/team';
import { useAuth } from '../../context/AuthContext';

interface RoleFormData {
  organizationType: OrganizationType;
  roleKey: string;
  displayName: string;
  description: string;
  allowedPages: string[];
}

export const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [filterOrgType, setFilterOrgType] = useState<OrganizationType | 'all'>('all');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('custom_roles')
        .select('*')
        .order('organization_type')
        .order('role_key');

      if (queryError) throw queryError;

      setRoles(data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Erreur lors du chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (formData: RoleFormData) => {
    try {
      const { error: insertError } = await supabase
        .from('custom_roles')
        .insert([{
          organization_type: formData.organizationType,
          role_key: formData.roleKey,
          display_name: formData.displayName,
          description: formData.description,
          allowed_pages: formData.allowedPages,
          is_system_role: false,
          is_active: true,
          created_by: user?.id
        }]);

      if (insertError) throw insertError;

      setShowCreateModal(false);
      await loadRoles();
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Erreur lors de la création du rôle');
    }
  };

  const handleUpdateRole = async (formData: RoleFormData) => {
    if (!selectedRole) return;

    try {
      const { error: updateError } = await supabase
        .from('custom_roles')
        .update({
          display_name: formData.displayName,
          description: formData.description,
          allowed_pages: formData.allowedPages,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRole.id);

      if (updateError) throw updateError;

      setShowEditModal(false);
      setSelectedRole(null);
      await loadRoles();
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleToggleActive = async (role: CustomRole) => {
    if (role.is_system_role) {
      alert('Les rôles système ne peuvent pas être désactivés');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('custom_roles')
        .update({
          is_active: !role.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', role.id);

      if (updateError) throw updateError;

      await loadRoles();
    } catch (err) {
      console.error('Error toggling role:', err);
      alert('Erreur lors de la modification du rôle');
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.is_system_role) {
      alert('Les rôles système ne peuvent pas être supprimés');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.display_name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', role.id);

      if (deleteError) throw deleteError;

      await loadRoles();
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Erreur lors de la suppression du rôle');
    }
  };

  const filteredRoles = filterOrgType === 'all'
    ? roles
    : roles.filter(r => r.organization_type === filterOrgType);

  const getOrgTypeLabel = (type: OrganizationType) => {
    const labels: Record<OrganizationType, string> = {
      client: 'Client',
      supplier: 'Fournisseur',
      admin: 'Admin'
    };
    return labels[type];
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des rôles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles</h1>
              <p className="text-gray-600">Définir les rôles et permissions pour toutes les interfaces</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadRoles}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un rôle
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Filtrer par interface:</label>
          <select
            value={filterOrgType}
            onChange={(e) => setFilterOrgType(e.target.value as OrganizationType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Toutes les interfaces</option>
            <option value="client">Interface Client</option>
            <option value="supplier">Interface Fournisseur</option>
            <option value="admin">Interface Admin</option>
          </select>
          <span className="text-sm text-gray-600">
            {filteredRoles.length} rôle{filteredRoles.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Interface
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pages autorisées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
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
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun rôle trouvé
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Shield className={`w-5 h-5 mr-3 ${role.is_system_role ? 'text-blue-600' : 'text-orange-600'}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{role.display_name}</div>
                          <div className="text-sm text-gray-500">{role.description || 'Aucune description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getOrgTypeLabel(role.organization_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {role.allowed_pages.length} page{role.allowed_pages.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {role.allowed_pages.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {role.is_system_role ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Lock className="w-3 h-3 mr-1" />
                          Système
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Personnalisé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {role.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir/Modifier"
                          disabled={role.is_system_role}
                        >
                          {role.is_system_role ? <Eye className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                        </button>

                        {!role.is_system_role && (
                          <>
                            <button
                              onClick={() => handleToggleActive(role)}
                              className={`p-2 rounded-lg transition-colors ${
                                role.is_active
                                  ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={role.is_active ? 'Désactiver' : 'Activer'}
                            >
                              <Shield className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <RoleFormModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSubmit={showCreateModal ? handleCreateRole : handleUpdateRole}
          role={selectedRole}
          isEdit={showEditModal}
        />
      )}
    </div>
  );
};

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  role?: CustomRole | null;
  isEdit: boolean;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, onSubmit, role, isEdit }) => {
  const [formData, setFormData] = useState<RoleFormData>({
    organizationType: role?.organization_type || 'client',
    roleKey: role?.role_key || '',
    displayName: role?.display_name || '',
    description: role?.description || '',
    allowedPages: role?.allowed_pages || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePages = PAGES_BY_ORG_TYPE[formData.organizationType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roleKey || !formData.displayName || formData.allowedPages.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePage = (pageId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedPages: prev.allowedPages.includes(pageId)
        ? prev.allowedPages.filter(p => p !== pageId)
        : [...prev.allowedPages, pageId]
    }));
  };

  if (!isOpen) return null;

  const isSystemRole = role?.is_system_role;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {isSystemRole ? 'Détails du rôle système' : isEdit ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Interface Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interface *
              </label>
              <select
                value={formData.organizationType}
                onChange={(e) => setFormData({ ...formData, organizationType: e.target.value as OrganizationType, allowedPages: [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isEdit || isSystemRole}
                required
              >
                <option value="client">Interface Client</option>
                <option value="supplier">Interface Fournisseur</option>
                <option value="admin">Interface Admin</option>
              </select>
            </div>

            {/* Role Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé du rôle (identifiant technique) *
              </label>
              <input
                type="text"
                value={formData.roleKey}
                onChange={(e) => setFormData({ ...formData, roleKey: e.target.value })}
                placeholder="ex: custom_manager, delivery_supervisor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isEdit || isSystemRole}
                required
              />
              <p className="mt-1 text-sm text-gray-500">Format: lettres minuscules, chiffres et underscores uniquement</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'affichage *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="ex: Gestionnaire Personnalisé"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isSystemRole}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle et de ses responsabilités..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isSystemRole}
              />
            </div>

            {/* Allowed Pages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pages autorisées * ({formData.allowedPages.length} sélectionnée{formData.allowedPages.length > 1 ? 's' : ''})
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {availablePages.map((page) => (
                  <label
                    key={page.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.allowedPages.includes(page.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isSystemRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowedPages.includes(page.id)}
                      onChange={() => !isSystemRole && togglePage(page.id)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      disabled={isSystemRole}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900">{page.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isSystemRole ? 'Fermer' : 'Annuler'}
              </button>
              {!isSystemRole && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le rôle'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
