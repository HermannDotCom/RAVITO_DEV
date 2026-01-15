import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { AddCreditCustomerData } from '../../../../types/activity';

interface NewCustomerModalProps {
  onClose: () => void;
  onSubmit: (data: AddCreditCustomerData) => Promise<boolean>;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<AddCreditCustomerData>({
    name: '',
    phone: '',
    address: '',
    notes: '',
    creditLimit: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Le nom du client est obligatoire');
      return;
    }

    setSubmitting(true);
    const success = await onSubmit(formData);
    setSubmitting(false);

    if (!success) {
      setError('Erreur lors de la création du client');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nouveau Client à Crédit</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom du client *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Jean Kouassi"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              autoFocus
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +225 07 12 34 56 78"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Cocody, Angré 8ème tranche"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Credit Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Plafond de crédit (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.creditLimit}
              onChange={(e) =>
                setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })
              }
              placeholder="0 = illimité"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Laisser à 0 pour un crédit illimité
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Création...' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
