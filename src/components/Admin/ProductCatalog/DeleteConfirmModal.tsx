import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Product } from '../../../types';

interface DeleteConfirmModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ product, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex items-center justify-center w-11 h-11 bg-red-100 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base">Supprimer le produit ?</h3>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">{product.name}</span> ({product.reference}) sera définitivement supprimé.
              Cette action est irréversible.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-lg flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
