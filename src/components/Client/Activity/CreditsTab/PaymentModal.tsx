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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg flex flex-col" 
           style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: '100%' }}>
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Encaisser un Règlement</h3>
              <p className="text-xs text-slate-600">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Current Balance */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-900">Solde dû actuel:</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(customer.currentBalance)} FCFA
                </span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Montant à encaisser (FCFA) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Entrez le montant"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Mode de paiement *
              </label>
              <div className="space-y-2">
                {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map(
                  (method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
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
                        onChange={() => setPaymentMethod(method)}
                        className="w-4 h-4 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-900">
                        {PAYMENT_METHOD_LABELS[method]}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Notes - Compact */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Note (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* New Balance Preview */}
            {amountNum > 0 && !isOverpayment && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border-2 border-green-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">Montant à encaisser:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(amountNum)} FCFA</span>
                  </div>
                  <div className="h-px bg-green-300"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900">Nouveau solde:</span>
                    <span className="font-bold text-base text-green-600">
                      {formatCurrency(newBalance)} FCFA
                    </span>
                  </div>
                  {isFullPayment && (
                    <div className="text-xs text-green-700">
                      ✓ Solde entièrement réglé
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cash Info */}
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Ce montant sera ajouté à la caisse du jour</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {error}
              </div>
            )}
          </div>

          {/* Footer - Fixed at Bottom */}
          <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-white safe-area-bottom">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || amountNum <= 0 || isOverpayment}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 font-semibold"
              >
                {submitting ? 'Encaissement...' : 'Encaisser'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};