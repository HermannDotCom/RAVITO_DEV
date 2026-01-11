import React from 'react';
import { Settings, X } from 'lucide-react';

interface ProductConfigModalProps {
  onClose: () => void;
}

/**
 * ProductConfigModal - Configuration des prix de vente
 * 
 * TODO: Implement full product configuration functionality
 * This modal should allow:
 * - Listing all products
 * - Setting selling prices for each product
 * - Setting minimum stock alerts
 * - Activating/deactivating products
 */
export const ProductConfigModal: React.FC<ProductConfigModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Configuration des Produits</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-700 mb-2">
              Configuration des prix de vente
            </h4>
            <p className="text-sm text-slate-600 mb-6">
              Cette fonctionnalité permet de configurer les prix de vente au client final
              pour chaque produit de votre établissement.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">À implémenter :</p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>Liste de tous les produits disponibles</li>
                <li>Saisie du prix de vente par produit</li>
                <li>Configuration des alertes de stock minimum</li>
                <li>Activation/désactivation des produits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
