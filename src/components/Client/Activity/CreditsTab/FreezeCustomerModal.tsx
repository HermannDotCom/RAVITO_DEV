import React, { useState } from 'react';
import { X, Snowflake, AlertTriangle } from 'lucide-react';
import { CreditCustomer, FreezeCustomerData } from '../../../../types/activity';

interface FreezeCustomerModalProps {
  customer: CreditCustomer;
  onClose: () => void;
  onSubmit: (data: FreezeCustomerData) => Promise<boolean>;
}

export const FreezeCustomerModal: React.FC<FreezeCustomerModalProps> = ({
  customer,
  onClose,
  onSubmit,
}) => {
  const [selectedOption, setSelectedOption] = useState<'freeze_full' | 'reduce_limit' | 'disable'>('freeze_full');
  const [newLimit, setNewLimit] = useState<string>('');
  const [reason, setReason] = useState<string>('');
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

    // Validate new limit if reduce_limit option is selected
    if (selectedOption === 'reduce_limit') {
      const limitValue = parseInt(newLimit);
      if (isNaN(limitValue) || limitValue < 0) {
        setError('Veuillez entrer un plafond valide');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data: FreezeCustomerData = {
        option: selectedOption,
        newLimit: selectedOption === 'reduce_limit' ? parseInt(newLimit) : undefined,
        reason: reason.trim() || undefined,
      };

      const success = await onSubmit(data);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Error freezing customer:', err);
      setError('Une erreur est survenue lors du gel du crédit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Geler le Crédit</h2>
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
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Le gel du crédit empêchera ce client d'effectuer de nouvelles consommations
                  jusqu'à ce qu'il règle sa dette ou que vous débloquiez son crédit.
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="block">
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'freeze_full'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="freezeOption"
                      value="freeze_full"
                      checked={selectedOption === 'freeze_full'}
                      onChange={(e) => setSelectedOption(e.target.value as 'freeze_full' | 'reduce_limit' | 'disable')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Geler complètement</p>
                      <p className="text-sm text-slate-600">
                        Le plafond sera égal au solde actuel ({formatCurrency(customer.currentBalance)} F).
                        Le client devra régler avant de pouvoir consommer à nouveau.
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              <label className="block">
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'reduce_limit'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="freezeOption"
                      value="reduce_limit"
                      checked={selectedOption === 'reduce_limit'}
                      onChange={(e) => setSelectedOption(e.target.value as 'freeze_full' | 'reduce_limit' | 'disable')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Réduire le plafond</p>
                      <p className="text-sm text-slate-600 mb-3">
                        Définir un nouveau plafond de crédit plus bas
                      </p>
                      {selectedOption === 'reduce_limit' && (
                        <input
                          type="number"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          placeholder="Nouveau plafond (FCFA)"
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </label>

              <label className="block">
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'disable'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="freezeOption"
                      value="disable"
                      checked={selectedOption === 'disable'}
                      onChange={(e) => setSelectedOption(e.target.value as 'freeze_full' | 'reduce_limit' | 'disable')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Désactiver définitivement</p>
                      <p className="text-sm text-slate-600">
                        Passer ce client en "cash only". Il ne pourra plus acheter à crédit.
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motif (optionnel)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Dette trop élevée, impayés récurrents..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Traitement...' : 'Confirmer le gel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
