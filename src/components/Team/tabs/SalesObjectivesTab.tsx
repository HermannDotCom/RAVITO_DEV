import React, { useState } from 'react';
import { Target, Pencil, Plus, Check, X } from 'lucide-react';
import { useSalesCommissions } from '../../../hooks/useSalesCommissions';
import { MONTH_NAMES } from '../../../types/sales';
import type { SalesObjective } from '../../../types/sales';

export const SalesObjectivesTab: React.FC = () => {
  const {
    salesReps,
    objectives,
    repsWithMetrics,
    selectedPeriod,
    setSelectedPeriod,
    currentPeriod,
    createOrUpdateObjective,
    deleteObjective,
    isLoading,
    error
  } = useSalesCommissions();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    salesRepId: '',
    objectiveChr: 40,
    objectiveDepots: 10
  });

  const handleCreateClick = () => {
    setFormData({
      salesRepId: '',
      objectiveChr: 40,
      objectiveDepots: 10
    });
    setShowCreateForm(true);
  };

  const handleEditClick = (objective: SalesObjective) => {
    setFormData({
      salesRepId: objective.salesRepId,
      objectiveChr: objective.objectiveChr,
      objectiveDepots: objective.objectiveDepots
    });
    setEditingId(objective.id);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await createOrUpdateObjective({
      salesRepId: formData.salesRepId,
      periodYear: selectedPeriod.year,
      periodMonth: selectedPeriod.month,
      objectiveChr: formData.objectiveChr,
      objectiveDepots: formData.objectiveDepots,
      createdBy: null // Will be set by backend
    });

    if (success) {
      setShowCreateForm(false);
      setEditingId(null);
      setFormData({ salesRepId: '', objectiveChr: 40, objectiveDepots: 10 });
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingId(null);
    setFormData({ salesRepId: '', objectiveChr: 40, objectiveDepots: 10 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">🎯 Objectifs Commerciaux</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Période active:</span>
            <select
              value={`${selectedPeriod.year}-${selectedPeriod.month}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                setSelectedPeriod({ year, month });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {/* Generate next 6 months */}
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(currentPeriod.year, currentPeriod.month - 1 + i, 1);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                return (
                  <option key={`${year}-${month}`} value={`${year}-${month}`}>
                    {MONTH_NAMES[month - 1]} {year}
                  </option>
                );
              })}
            </select>
          </div>
          
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle période</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Objectives Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commercial
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obj. CHR
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réalisé
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obj. Dépôts
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réalisé
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {repsWithMetrics.map((rep) => {
                const objective = objectives.find(o => o.salesRepId === rep.id);
                const chrReached = objective && rep.chrActivated >= objective.objectiveChr;
                const depotReached = objective && rep.depotActivated >= objective.objectiveDepots;

                return (
                  <tr key={rep.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{rep.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {objective?.objectiveChr || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-sm font-medium ${
                          chrReached ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {rep.chrActivated}
                        </span>
                        {chrReached && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {objective?.objectiveDepots || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-sm font-medium ${
                          depotReached ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {rep.depotActivated}
                        </span>
                        {depotReached && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {objective ? (
                        <button
                          onClick={() => handleEditClick(objective)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setFormData({
                              salesRepId: rep.id,
                              objectiveChr: 40,
                              objectiveDepots: 10
                            });
                            setShowCreateForm(true);
                          }}
                          className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          Définir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ➕ {editingId ? 'Modifier l\'objectif' : 'Définir un nouvel objectif'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commercial
              </label>
              <select
                value={formData.salesRepId}
                onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
                required
                disabled={!!editingId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner un commercial</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectif CHR activés
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.objectiveChr}
                  onChange={(e) => setFormData({ ...formData, objectiveChr: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectif Dépôts activés
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.objectiveDepots}
                  onChange={(e) => setFormData({ ...formData, objectiveDepots: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
