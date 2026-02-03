import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import type { SubscriptionPlan, UpdatePlanData } from '../../../types/subscription';
import { formatCurrency, getBillingCycleName } from '../../../types/subscription';
import { getAllPlans, updatePlan } from '../../../services/admin/subscriptionAdminService';
import { useToast } from '../../../context/ToastContext';

export const PlansTab: React.FC = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdatePlanData>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getAllPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      showToast('Erreur lors du chargement des plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditData({
      price: plan.price,
      description: plan.description || '',
      isActive: plan.isActive
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (planId: string) => {
    try {
      setSaving(true);
      await updatePlan(planId, editData);
      showToast('Plan mis à jour avec succès', 'success');
      setEditingId(null);
      setEditData({});
      await loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      showToast('Erreur lors de la mise à jour du plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      showToast(
        plan.isActive ? 'Plan désactivé' : 'Plan activé',
        'success'
      );
      await loadPlans();
    } catch (error) {
      console.error('Error toggling plan:', error);
      showToast('Erreur lors de la modification du plan', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion des Plans</h3>
          <p className="text-sm text-gray-600">Modifier les tarifs et activer/désactiver les plans</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cycle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map((plan) => {
              const isEditing = editingId === plan.id;

              return (
                <tr key={plan.id} className={isEditing ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{plan.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getBillingCycleName(plan.billingCycle)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.price || 0}
                        onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Prix"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(plan.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Description"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{plan.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      disabled={isEditing}
                      className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${plan.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }
                        ${!isEditing && 'hover:opacity-80 cursor-pointer'}
                        ${isEditing && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      {plan.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSave(plan.id)}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Enregistrer
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(plan)}
                        className="inline-flex items-center px-3 py-1 text-orange-600 hover:text-orange-700"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les modifications de prix ne s'appliquent qu'aux nouveaux abonnements</li>
          <li>• Les abonnements en cours conservent leur tarif initial</li>
          <li>• Désactiver un plan empêche les nouvelles souscriptions</li>
        </ul>
      </div>
    </div>
  );
};
