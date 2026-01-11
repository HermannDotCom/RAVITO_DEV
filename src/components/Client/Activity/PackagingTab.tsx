import React, { useState } from 'react';
import { Package2, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [editValues, setEditValues] = useState<UpdatePackagingData>({});

  const handleEdit = (pkg: DailyPackaging) => {
    setEditingId(pkg.id);
    setEditValues({
      qtyFullStart: pkg.qtyFullStart,
      qtyEmptyStart: pkg.qtyEmptyStart,
      qtyConsignesPaid: pkg.qtyConsignesPaid || 0,
      qtyFullEnd: pkg.qtyFullEnd || undefined,
      qtyEmptyEnd: pkg.qtyEmptyEnd || undefined,
      notes: pkg.notes || '',
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

  const calculateDifference = (pkg: DailyPackaging, editingValues?: UpdatePackagingData): number | undefined => {
    const isEditing = editingId === pkg.id && editingValues;
    
    const qtyFullStart = isEditing && editingValues.qtyFullStart !== undefined 
      ? editingValues.qtyFullStart 
      : pkg.qtyFullStart;
    const qtyEmptyStart = isEditing && editingValues.qtyEmptyStart !== undefined 
      ? editingValues.qtyEmptyStart 
      : pkg.qtyEmptyStart;
    const qtyConsignesPaid = isEditing && editingValues.qtyConsignesPaid !== undefined 
      ? editingValues.qtyConsignesPaid 
      : (pkg.qtyConsignesPaid || 0);
    const qtyFullEnd = isEditing && editingValues.qtyFullEnd !== undefined 
      ? editingValues.qtyFullEnd 
      : pkg.qtyFullEnd;
    const qtyEmptyEnd = isEditing && editingValues.qtyEmptyEnd !== undefined 
      ? editingValues.qtyEmptyEnd 
      : pkg.qtyEmptyEnd;

    const totalStart = qtyFullStart + qtyEmptyStart;
    
    if (qtyFullEnd !== null && qtyFullEnd !== undefined && 
        qtyEmptyEnd !== null && qtyEmptyEnd !== undefined) {
      const totalEnd = qtyFullEnd + qtyEmptyEnd;
      // Écart = Total Final - (Total Initial + Reçus - Rendus - Consignes Payées)
      return totalEnd - (totalStart + pkg.qtyReceived - pkg.qtyReturned - qtyConsignesPaid);
    }
    
    return undefined;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package2 className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-bold text-slate-900">Gestion des Emballages</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Formule de l'écart</p>
        <p className="text-xs">
          Écart = Total Final - (Total Initial + Reçus - Rendus - Consignes Payées)
        </p>
        <p className="text-xs mt-1">
          Un écart de 0 indique que tout est en ordre. Utilisez les observations pour justifier tout écart.
        </p>
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="text-left py-3 px-2 font-semibold border border-orange-200">Type Emballage</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Pleins Initial</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Vides Initial</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Total Initial</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Reçus (auto)</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Rendus (auto)</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Consignes Payées</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Pleins Final</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Vides Final</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Total Final</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Écart</th>
              <th className="text-center py-3 px-2 font-semibold border border-orange-200">Observation</th>
              {!isReadOnly && <th className="text-center py-3 px-2 font-semibold border border-orange-200">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {packaging.map((pkg) => {
              const isEditing = editingId === pkg.id;
              
              const qtyFullStart = isEditing && editValues.qtyFullStart !== undefined 
                ? editValues.qtyFullStart 
                : pkg.qtyFullStart;
              const qtyEmptyStart = isEditing && editValues.qtyEmptyStart !== undefined 
                ? editValues.qtyEmptyStart 
                : pkg.qtyEmptyStart;
              const qtyConsignesPaid = isEditing && editValues.qtyConsignesPaid !== undefined 
                ? editValues.qtyConsignesPaid 
                : (pkg.qtyConsignesPaid || 0);
              const qtyFullEnd = isEditing && editValues.qtyFullEnd !== undefined 
                ? editValues.qtyFullEnd 
                : pkg.qtyFullEnd;
              const qtyEmptyEnd = isEditing && editValues.qtyEmptyEnd !== undefined 
                ? editValues.qtyEmptyEnd 
                : pkg.qtyEmptyEnd;
              const notes = isEditing && editValues.notes !== undefined 
                ? editValues.notes 
                : (pkg.notes || '');
              
              const totalStart = qtyFullStart + qtyEmptyStart;
              const totalEnd = (qtyFullEnd !== null && qtyFullEnd !== undefined) &&
                              (qtyEmptyEnd !== null && qtyEmptyEnd !== undefined)
                ? qtyFullEnd + qtyEmptyEnd
                : undefined;
              
              const difference = calculateDifference(pkg, isEditing ? editValues : undefined);
              const hasDiscrepancy = difference !== undefined && difference !== 0;

              return (
                <tr
                  key={pkg.id}
                  className={`border-b border-orange-200 ${
                    hasDiscrepancy ? 'bg-red-50' : 'hover:bg-orange-50'
                  }`}
                >
                  <td className="py-3 px-2 border border-orange-200">
                    <div className="font-medium text-slate-900">{getCrateTypeLabel(pkg.crateType)}</div>
                    <div className="text-xs text-slate-600">{pkg.crateType}</div>
                  </td>
                  
                  {/* Pleins Initial - Editable */}
                  <td className="py-3 px-2 text-center border border-orange-200">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.qtyFullStart ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, qtyFullStart: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      qtyFullStart
                    )}
                  </td>
                  
                  {/* Vides Initial - Editable */}
                  <td className="py-3 px-2 text-center border border-orange-200">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.qtyEmptyStart ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, qtyEmptyStart: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      qtyEmptyStart
                    )}
                  </td>
                  
                  <td className="py-3 px-2 text-center font-medium border border-orange-200">{totalStart}</td>
                  <td className="py-3 px-2 text-center text-green-700 font-medium border border-orange-200">+{pkg.qtyReceived}</td>
                  <td className="py-3 px-2 text-center text-red-700 font-medium border border-orange-200">-{pkg.qtyReturned}</td>
                  
                  {/* Consignes Payées - Editable */}
                  <td className="py-3 px-2 text-center border border-orange-200">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.qtyConsignesPaid ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, qtyConsignesPaid: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      qtyConsignesPaid
                    )}
                  </td>
                  
                  {/* Pleins Final - Editable */}
                  <td className="py-3 px-2 text-center border border-orange-200">
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
                  
                  {/* Vides Final - Editable */}
                  <td className="py-3 px-2 text-center border border-orange-200">
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
                  
                  <td className="py-3 px-2 text-center font-medium border border-orange-200">
                    {totalEnd ?? '-'}
                  </td>
                  
                  {/* Écart */}
                  <td className="py-3 px-2 text-center border border-orange-200">
                    {hasDiscrepancy ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded font-medium bg-red-50 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        {difference > 0 ? '+' : ''}{difference}
                      </span>
                    ) : (
                      totalEnd !== undefined && (
                        <span className="text-green-600 font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                      )
                    )}
                  </td>
                  
                  {/* Observation - Editable */}
                  <td className="py-3 px-2 border border-orange-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues.notes ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, notes: e.target.value })
                        }
                        placeholder="Notes..."
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">{notes || '-'}</span>
                    )}
                  </td>
                  
                  {!isReadOnly && (
                    <td className="py-3 px-2 text-center border border-orange-200">
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
                          className="text-orange-600 hover:text-orange-700 text-xs font-medium"
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

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {packaging.map((pkg) => {
          const isEditing = editingId === pkg.id;
          
          const qtyFullStart = isEditing && editValues.qtyFullStart !== undefined 
            ? editValues.qtyFullStart 
            : pkg.qtyFullStart;
          const qtyEmptyStart = isEditing && editValues.qtyEmptyStart !== undefined 
            ? editValues.qtyEmptyStart 
            : pkg.qtyEmptyStart;
          const qtyConsignesPaid = isEditing && editValues.qtyConsignesPaid !== undefined 
            ? editValues.qtyConsignesPaid 
            : (pkg.qtyConsignesPaid || 0);
          const qtyFullEnd = isEditing && editValues.qtyFullEnd !== undefined 
            ? editValues.qtyFullEnd 
            : pkg.qtyFullEnd;
          const qtyEmptyEnd = isEditing && editValues.qtyEmptyEnd !== undefined 
            ? editValues.qtyEmptyEnd 
            : pkg.qtyEmptyEnd;
          const notes = isEditing && editValues.notes !== undefined 
            ? editValues.notes 
            : (pkg.notes || '');
          
          const totalStart = qtyFullStart + qtyEmptyStart;
          const totalEnd = (qtyFullEnd !== null && qtyFullEnd !== undefined) &&
                          (qtyEmptyEnd !== null && qtyEmptyEnd !== undefined)
            ? qtyFullEnd + qtyEmptyEnd
            : undefined;
          
          const difference = calculateDifference(pkg, isEditing ? editValues : undefined);
          const hasDiscrepancy = difference !== undefined && difference !== 0;

          return (
            <div
              key={pkg.id}
              className={`rounded-lg p-3 border-2 ${
                hasDiscrepancy
                  ? 'bg-red-50 border-red-300'
                  : 'bg-slate-50 border-orange-200'
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
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-300">
                  <div>
                    <p className="text-slate-600 mb-1 font-medium">Comptage Initial</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Pleins:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.qtyFullStart ?? ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, qtyFullStart: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                          />
                        ) : (
                          <span className="font-medium">{qtyFullStart}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Vides:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.qtyEmptyStart ?? ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, qtyEmptyStart: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                          />
                        ) : (
                          <span className="font-medium">{qtyEmptyStart}</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 pt-1 border-t border-slate-300">Total: {totalStart}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1 font-medium">Mouvements</p>
                    <div className="space-y-1">
                      <p><span className="text-slate-600">Reçus:</span> <span className="font-medium text-green-700">+{pkg.qtyReceived}</span></p>
                      <p><span className="text-slate-600">Rendus:</span> <span className="font-medium text-red-700">-{pkg.qtyReturned}</span></p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-300">
                        <span className="text-slate-600">Consignes:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.qtyConsignesPaid ?? ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, qtyConsignesPaid: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                          />
                        ) : (
                          <span className="font-medium">{qtyConsignesPaid}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-600 mb-1 font-medium">Comptage Final</p>
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
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
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
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
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

                {/* Observation */}
                <div>
                  <p className="text-slate-600 mb-1 font-medium">Observation</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValues.notes ?? ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, notes: e.target.value })
                      }
                      placeholder="Notes, explications..."
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  ) : (
                    <p className="text-slate-700">{notes || '-'}</p>
                  )}
                </div>

                {hasDiscrepancy && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-red-900">Écart détecté: {difference > 0 ? '+' : ''}{difference}</p>
                      <p className="text-red-800">
                        {difference > 0 ? 'Casiers en surplus' : 'Casiers manquants'}
                      </p>
                    </div>
                  </div>
                )}
                
                {!hasDiscrepancy && totalEnd !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-green-100 border border-green-300 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-medium text-green-900">Comptage conforme</p>
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

      {packaging.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun emballage configuré</p>
        </div>
      )}
    </div>
  );
};
