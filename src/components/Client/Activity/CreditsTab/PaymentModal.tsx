import React, { useState } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';
import { CreditCustomer, AddPaymentData, PAYMENT_METHOD_LABELS } from '../../../../types/activity';

interface PaymentModalProps {
  customer: CreditCustomer;
  onClose: () => void;
  onSubmit: (data: AddPaymentData) => Promise<boolean>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  customer,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseInt(amount) || 0;
  const newBalance = customer.currentBalance - amountNum;
  const isFullPayment = amountNum === customer.currentBalance;
  const isOverpayment = amountNum > customer.currentBalance;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const setFullPayment = () => {
    setAmount(customer.currentBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountNum <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (isOverpayment) {
      setError('Le montant ne peut pas dépasser le solde dû');
      return;
    }

    setSubmitting(true);
    const success = await onSubmit({
      customerId: customer.id,
      amount: amountNum,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (!success) {
      setError('Erreur lors de l\'enregistrement du règlement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-120px)] flex flex-col">
        {/* Header - fixe */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Encaisser un Règlement</h3>
              <p className="text-xs sm:text-sm text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={submitting}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form - scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          {/* Current Balance */}
          <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-orange-900">Solde dû actuel:</span>
              <span className="text-lg sm:text-xl font-bold text-orange-600">
                {formatCurrency(customer.currentBalance)} FCFA
              </span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Montant à encaisser (FCFA) *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Entrez le montant"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={setFullPayment}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Règlement total
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.floor(customer.currentBalance / 2).toString())}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                50%
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Mode de paiement *
            </label>
            <div className="space-y-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map(
                (method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === method
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as 'cash' | 'mobile_money' | 'transfer')
                      }
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600"
                    />
                    <span className="text-sm sm:text-base font-medium text-slate-900">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Note (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* New Balance Preview */}
          {amountNum > 0 && !isOverpayment && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border-2 border-green-200">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-700">Montant à encaisser:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(amountNum)} FCFA</span>
                </div>
                <div className="h-px bg-green-300"></div>
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base font-medium text-slate-900">Nouveau solde:</span>
                  <span className="font-bold text-base sm:text-lg text-green-600">
                    {formatCurrency(newBalance)} FCFA
                  </span>
                </div>
                {isFullPayment && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-green-700 mt-1">
                    <span>✓ Solde entièrement réglé</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cash Info */}
          <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-800">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Ce montant sera ajouté à la caisse du jour</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-800">
              {error}
            </div>
          )}

          </div>

          {/* Footer with buttons - fixe */}
          <div className="p-4 sm:p-5 border-t flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm sm:text-base hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || amountNum <= 0 || isOverpayment}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg text-sm sm:text-base hover:bg-green-600 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Encaissement...' : 'Encaisser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
