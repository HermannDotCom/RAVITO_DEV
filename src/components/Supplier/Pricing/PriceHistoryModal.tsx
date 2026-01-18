/**
 * PriceHistoryModal - Modal pour afficher l'historique des modifications
 */

import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useSupplierPriceGridManagement, usePriceFormatter } from '../../../hooks/usePricing';
import { SupplierPriceGridHistory } from '../../../services/pricing/supplierPriceService';

interface PriceHistoryModalProps {
  gridId: string;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ gridId, onClose }) => {
  const { getHistory, isLoading } = useSupplierPriceGridManagement();
  const { formatPrice } = usePriceFormatter();
  const [history, setHistory] = useState<SupplierPriceGridHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, [gridId]);

  const loadHistory = async () => {
    const data = await getHistory(gridId);
    setHistory(data);
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      created: 'Création',
      updated: 'Modification',
      deleted: 'Suppression',
      activated: 'Activation',
      deactivated: 'Désactivation',
    };
    return labels[type] || type;
  };

  const getChangeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      activated: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      deactivated: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <Card className="w-full h-[90vh] sm:h-auto sm:max-w-3xl sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Historique des Modifications
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(
                        entry.changeType
                      )}`}
                    >
                      {getChangeTypeLabel(entry.changeType)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.changedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  {entry.changeType === 'updated' && (
                    <div className="space-y-2 mt-3">
                      {entry.oldCratePrice !== entry.newCratePrice && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Prix casier: </span>
                          <span className="text-red-600 line-through mr-2">
                            {entry.oldCratePrice ? formatPrice(entry.oldCratePrice) : '-'}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {entry.newCratePrice ? formatPrice(entry.newCratePrice) : '-'}
                          </span>
                        </div>
                      )}
                      {entry.oldUnitPrice !== entry.newUnitPrice && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Prix unitaire: </span>
                          <span className="text-red-600 line-through mr-2">
                            {entry.oldUnitPrice ? formatPrice(entry.oldUnitPrice) : '-'}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {entry.newUnitPrice ? formatPrice(entry.newUnitPrice) : '-'}
                          </span>
                        </div>
                      )}
                      {entry.oldConsignPrice !== entry.newConsignPrice && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Consigne: </span>
                          <span className="text-red-600 line-through mr-2">
                            {entry.oldConsignPrice ? formatPrice(entry.oldConsignPrice) : '-'}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {entry.newConsignPrice ? formatPrice(entry.newConsignPrice) : '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.changeReason && (
                    <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Raison: </span>
                      {entry.changeReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </Card>
    </div>
  );
};
