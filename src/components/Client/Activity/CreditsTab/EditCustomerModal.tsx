import React, { useState } from 'react';
import { X, Edit, Trash2, Calendar, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { CreditCustomer, UpdateCustomerData, CUSTOMER_STATUS_LABELS } from '../../../../types/activity';

interface EditCustomerModalProps {
  customer: CreditCustomer;
  onClose: () => void;
  onSubmit: (data: UpdateCustomerData) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone || '');
  const [address, setAddress] = useState(customer.address || '');
  const [notes, setNotes] = useState(customer.notes || '');
  const [creditLimit, setCreditLimit] = useState(customer.creditLimit.toString());
  const [status, setStatus] = useState(customer.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateDaysSincePayment = () => {
    if (!customer.lastPaymentDate) {
      const created = new Date(customer.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const lastPayment = new Date(customer.lastPaymentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastPayment.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    const limitValue = parseInt(creditLimit);
    if (isNaN(limitValue) || limitValue < 0) {
      setError('Veuillez entrer un plafond valide (0 pour illimité)');
      return;
    }

    setSubmitting(true);
    try {
      const data: UpdateCustomerData = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        creditLimit: limitValue,
        status,
      };

      const success = await onSubmit(data);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setSubmitting(true);
    try {
      const success = await onDelete();
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const daysSincePayment = calculateDaysSincePayment();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Modifier le Client</h2>
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
            {/* Statistics Section (Read-only) */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Statistiques (lecture seule)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">Solde actuel</div>
                  <div className="text-lg font-bold text-orange-900">
                    {formatCurrency(customer.currentBalance)}
                  </div>
                  <div className="text-xs text-orange-600">FCFA</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">Total crédité</div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(customer.totalCredited)}
                  </div>
                  <div className="text-xs text-blue-600">FCFA</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">Total réglé</div>
                  <div className="text-lg font-bold text-green-900">
                    {formatCurrency(customer.totalPaid)}
                  </div>
                  <div className="text-xs text-green-600">FCFA</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">Client depuis</div>
                  <div className="text-sm font-bold text-purple-900">
                    {formatDate(customer.createdAt)}
                  </div>
                  <div className="text-xs text-purple-600">
                    {customer.lastPaymentDate && (
                      <span>Dernier paiement: {daysSincePayment}j</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* General Information Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Informations Générales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quartier, ville..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations complémentaires..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Credit Parameters Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Paramètres Crédit</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plafond crédit (FCFA)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    min="0"
                    placeholder="0 = illimité"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Laissez 0 pour un plafond illimité
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="active">{CUSTOMER_STATUS_LABELS.active}</option>
                    <option value="frozen">{CUSTOMER_STATUS_LABELS.frozen}</option>
                    <option value="disabled">{CUSTOMER_STATUS_LABELS.disabled}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {status === 'active' && 'Le client peut consommer normalement'}
                    {status === 'frozen' && 'Le crédit est temporairement gelé'}
                    {status === 'disabled' && 'Le crédit est définitivement désactivé'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-900 mb-1">Confirmer la suppression</h4>
                    <p className="text-sm text-red-800">
                      Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
                      L'historique des transactions sera conservé mais le client sera désactivé.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {submitting ? 'Suppression...' : 'Supprimer définitivement'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200">
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
