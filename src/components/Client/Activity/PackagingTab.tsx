import React, { useState } from 'react';
import { Package2, AlertTriangle } from 'lucide-react';
import { DailyPackaging, UpdatePackagingData, CRATE_TYPE_LABELS } from '../../../types/activity';

interface PackagingTabProps {
  packaging: DailyPackaging[];
  isReadOnly: boolean;
  onUpdatePackaging: (packagingId: string, data: UpdatePackagingData) => Promise<boolean>;
}

export const PackagingTab: React.FC<PackagingTabProps> = ({
  packaging,
  isReadOnly,
  onUpdatePackaging,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ qtyFullEnd?: number; qtyEmptyEnd?: number }>({});

  const handleEdit = (pkg: DailyPackaging) => {
    setEditingId(pkg.id);
    setEditValues({
      qtyFullEnd: pkg.qtyFullEnd || undefined,
      qtyEmptyEnd: pkg.qtyEmptyEnd || undefined,
    });
  };

  const handleSave = async (packagingId: string) => {
    const success = await onUpdatePackaging(packagingId, editValues);
    if (success) {
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getCrateTypeLabel = (crateType: string): string => {
    return CRATE_TYPE_LABELS[crateType as keyof typeof CRATE_TYPE_LABELS] || crateType;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package2 className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-slate-900">Suivi des Casiers</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Vérification du stock de casiers</p>
        <p className="text-xs">
          Le total de casiers (pleins + vides) doit rester constant. Toute différence indique une perte ou un gain.
        </p>
      </div>

      {/* Packaging table - Mobile view */}
      <div className="sm:hidden space-y-3">
        {packaging.map((pkg) => {
          const isEditing = editingId === pkg.id;
          const qtyFullEnd = isEditing ? (editValues.qtyFullEnd ?? pkg.qtyFullEnd) : pkg.qtyFullEnd;
          const qtyEmptyEnd = isEditing ? (editValues.qtyEmptyEnd ?? pkg.qtyEmptyEnd) : pkg.qtyEmptyEnd;
          
          const totalStart = pkg.qtyFullStart + pkg.qtyEmptyStart;
          const totalEnd = (qtyFullEnd !== null && qtyFullEnd !== undefined) &&
                          (qtyEmptyEnd !== null && qtyEmptyEnd !== undefined)
            ? qtyFullEnd + qtyEmptyEnd
            : undefined;
          const difference = totalEnd !== undefined ? totalEnd - totalStart : undefined;
          const hasDiscrepancy = difference !== undefined && difference !== 0;

          return (
            <div
              key={pkg.id}
              className={`rounded-lg p-3 border-2 ${
                hasDiscrepancy
                  ? 'bg-red-50 border-red-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    {getCrateTypeLabel(pkg.crateType)}
                  </h3>
                  <p className="text-xs text-slate-600">{pkg.crateType}</p>
                </div>
                {!isReadOnly && !isEditing && (
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-300">
                  <div>
                    <p className="text-slate-600 mb-1">Matin</p>
                    <div className="space-y-1">
                      <p><span className="text-slate-600">Pleins:</span> <span className="font-medium">{pkg.qtyFullStart}</span></p>
                      <p><span className="text-slate-600">Vides:</span> <span className="font-medium">{pkg.qtyEmptyStart}</span></p>
                      <p className="font-bold text-slate-900">Total: {totalStart}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Mouvements</p>
                    <div className="space-y-1">
                      <p><span className="text-slate-600">Reçus:</span> <span className="font-medium text-green-700">+{pkg.qtyReceived}</span></p>
                      <p><span className="text-slate-600">Rendus:</span> <span className="font-medium text-red-700">-{pkg.qtyReturned}</span></p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">Soir</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Pleins:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues.qtyFullEnd ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, qtyFullEnd: parseInt(e.target.value) || 0 })
                          }
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                        />
                      ) : (
                        <span className="font-medium">{qtyFullEnd ?? '-'}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Vides:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues.qtyEmptyEnd ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, qtyEmptyEnd: parseInt(e.target.value) || 0 })
                          }
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                        />
                      ) : (
                        <span className="font-medium">{qtyEmptyEnd ?? '-'}</span>
                      )}
                    </div>
                    {totalEnd !== undefined && (
                      <p className="font-bold text-slate-900 pt-1 border-t border-slate-300">
                        Total: {totalEnd}
                      </p>
                    )}
                  </div>
                </div>

                {hasDiscrepancy && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-red-900">Écart détecté: {difference}</p>
                      <p className="text-red-800">
                        {difference > 0 ? 'Casiers en surplus' : 'Casiers manquants'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSave(pkg.id)}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-3 py-1.5 bg-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-400"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Packaging table - Desktop view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-2 font-semibold text-slate-700">Type Casier</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Pleins Matin</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Vides Matin</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Total Matin</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Reçus</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Rendus</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Pleins Soir</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Vides Soir</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Total Soir</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Écart</th>
              {!isReadOnly && <th className="text-center py-3 px-2 font-semibold text-slate-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {packaging.map((pkg) => {
              const isEditing = editingId === pkg.id;
              const qtyFullEnd = isEditing ? (editValues.qtyFullEnd ?? pkg.qtyFullEnd) : pkg.qtyFullEnd;
              const qtyEmptyEnd = isEditing ? (editValues.qtyEmptyEnd ?? pkg.qtyEmptyEnd) : pkg.qtyEmptyEnd;
              
              const totalStart = pkg.qtyFullStart + pkg.qtyEmptyStart;
              const totalEnd = (qtyFullEnd !== null && qtyFullEnd !== undefined) &&
                              (qtyEmptyEnd !== null && qtyEmptyEnd !== undefined)
                ? qtyFullEnd + qtyEmptyEnd
                : undefined;
              const difference = totalEnd !== undefined ? totalEnd - totalStart : undefined;
              const hasDiscrepancy = difference !== undefined && difference !== 0;

              return (
                <tr
                  key={pkg.id}
                  className={`border-b border-slate-100 ${
                    hasDiscrepancy ? 'bg-red-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">{getCrateTypeLabel(pkg.crateType)}</div>
                    <div className="text-xs text-slate-600">{pkg.crateType}</div>
                  </td>
                  <td className="py-3 px-2 text-center">{pkg.qtyFullStart}</td>
                  <td className="py-3 px-2 text-center">{pkg.qtyEmptyStart}</td>
                  <td className="py-3 px-2 text-center font-medium">{totalStart}</td>
                  <td className="py-3 px-2 text-center text-green-700 font-medium">+{pkg.qtyReceived}</td>
                  <td className="py-3 px-2 text-center text-red-700 font-medium">-{pkg.qtyReturned}</td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.qtyFullEnd ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, qtyFullEnd: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      qtyFullEnd ?? '-'
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.qtyEmptyEnd ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, qtyEmptyEnd: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      qtyEmptyEnd ?? '-'
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-medium">
                    {totalEnd ?? '-'}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {hasDiscrepancy ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium ${
                          difference < 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {difference > 0 ? '+' : ''}{difference}
                      </span>
                    ) : (
                      totalEnd !== undefined && (
                        <span className="text-green-600 font-medium">✓ OK</span>
                      )
                    )}
                  </td>
                  {!isReadOnly && (
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSave(pkg.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="text-amber-600 hover:text-amber-700 text-xs font-medium"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {packaging.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun casier configuré</p>
        </div>
      )}
    </div>
  );
};
