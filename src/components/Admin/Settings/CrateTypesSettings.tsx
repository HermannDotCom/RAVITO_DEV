import React from 'react';
import { Package } from 'lucide-react';
import { useCrateTypes } from '../../../hooks/useCrateTypes';

export const CrateTypesSettings: React.FC = () => {
  const { crateTypes, loading, toggleConsignable } = useCrateTypes();

  const handleToggle = async (id: string, currentValue: boolean) => {
    await toggleConsignable(id, !currentValue);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-bold text-gray-900">Emballages consignables</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {crateTypes.map((crateType) => (
          <div
            key={crateType.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{crateType.icon}</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{crateType.label}</p>
                <p className="text-xs text-gray-500">{crateType.code}</p>
              </div>
            </div>
            
            {/* Toggle Switch - Style identique aux moyens de paiement */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={crateType.isConsignable}
                onChange={() => handleToggle(crateType.id, crateType.isConsignable)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        💡 Les emballages consignables génèrent des casiers vides à récupérer lors des livraisons.
      </p>
    </div>
  );
};
