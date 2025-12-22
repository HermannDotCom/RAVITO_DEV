/**
 * ResetQuantitiesModal - Modal de confirmation pour la réinitialisation des quantités vendues
 */

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../../ui/Card';

interface ResetQuantitiesModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ResetQuantitiesModal: React.FC<ResetQuantitiesModalProps> = ({ onClose, onConfirm }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsResetting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error resetting quantities:', error);
      alert('Erreur lors de la réinitialisation des quantités');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Réinitialiser les quantités
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isResetting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Êtes-vous sûr de vouloir réinitialiser toutes les quantités vendues à zéro ?
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-300">
                  <p className="font-medium mb-2">Cette action est irréversible</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Toutes les quantités vendues seront remises à zéro</li>
                    <li>Un nouveau cycle de cumul des ventes va démarrer</li>
                    <li>Cette opération affecte tous vos produits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-medium">Conseil :</span> Effectuez cette action au début de votre journée 
              ou cycle d'activité pour un suivi optimal de vos ventes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isResetting}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isResetting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Confirmer la réinitialisation
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
};
