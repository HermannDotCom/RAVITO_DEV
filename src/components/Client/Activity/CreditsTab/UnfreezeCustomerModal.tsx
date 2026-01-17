import React, { useState } from 'react';
import { X, Unlock } from 'lucide-react';
import { CreditCustomer } from '../../../../types/activity';

interface UnfreezeCustomerModalProps {
  customer: CreditCustomer;
  onClose: () => void;
  onSubmit: (newLimit?: number) => Promise<boolean>;
}

export const UnfreezeCustomerModal: React.FC<UnfreezeCustomerModalProps> = ({
  customer,
  onClose,
  onSubmit,
}) => {
  const [newLimit, setNewLimit] = useState<string>(
    customer.creditLimit > 0 ? customer.creditLimit.toString() : ''
  );
  const [changeLimit, setChangeLimit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate new limit if changing
    if (changeLimit) {
      const limitValue = parseInt(newLimit);
      if (isNaN(limitValue) || limitValue < 0) {
        setError('Veuillez entrer un plafond valide');
        return;
      }
    }

    setSubmitting(true);
    try {
      const limitToApply = changeLimit ? parseInt(newLimit) : undefined;
      const success = await onSubmit(limitToApply);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Error unfreezing customer:', err);
      setError('Une erreur est survenue lors du déblocage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Unlock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Débloquer le Crédit</h2>
              <p className="text-sm text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Solde actuel</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(customer.currentBalance)} F
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Plafond actuel</p>
                  <p className="text-lg font-bold text-slate-900">
                    {customer.creditLimit > 0 
                      ? `${formatCurrency(customer.creditLimit)} F`
                      : 'Illimité'}
                  </p>
                </div>
              </div>
              {customer.freezeReason && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Motif du gel:</p>
                  <p className="text-sm text-slate-900">{customer.freezeReason}</p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Le déblocage permettra à ce client d'effectuer à nouveau des achats à crédit
                dans les limites de son plafond.
              </p>
            </div>

            {/* Option to change limit */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={changeLimit}
                  onChange={(e) => setChangeLimit(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Définir un nouveau plafond
                </span>
              </label>
              
              {changeLimit && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Nouveau plafond (0 = illimité)"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Laissez 0 pour un plafond illimité
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Traitement...' : 'Débloquer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
