import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AddExpenseData, EXPENSE_CATEGORIES } from '../../../types/activity';

interface ExpenseModalProps {
  onClose: () => void;
  onSubmit: (data: AddExpenseData) => Promise<boolean>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AddExpenseData>({
    label: '',
    amount: 0,
    category: 'other',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.label.trim()) {
      setError('Veuillez entrer une description');
      return;
    }

    if (formData.amount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    setSubmitting(true);
    const success = await onSubmit(formData);
    setSubmitting(false);

    if (!success) {
      setError('Erreur lors de l\'ajout de la dépense');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Ajouter une dépense</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Ex: Glaçons, Taxi, Électricité..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant (FCFA) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 5000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as AddExpenseData['category'],
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
