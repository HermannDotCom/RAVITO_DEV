import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, Building2, Banknote, HelpCircle, AlertCircle } from 'lucide-react';
import type { PaymentMethodConfig } from '../../types/subscription';
import { formatCurrency } from '../../types/subscription';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceId?: string;
  invoiceNumber?: string;
  onPaymentConfirm?: (data: {
    paymentMethod: string;
    transactionReference: string;
  }) => Promise<void>;
}

const MOBILE_MONEY_METHODS = ['wave', 'orange_money', 'mtn_money'];

const hasConfiguredDetails = (method: PaymentMethodConfig): boolean => {
  if (MOBILE_MONEY_METHODS.includes(method.name)) {
    return !!method.phoneNumber;
  }
  if (method.name === 'bank_transfer') {
    return !!method.iban;
  }
  if (method.name === 'cash') {
    return true;
  }
  return !!method.phoneNumber || !!method.iban || !!method.instructions;
};

const getMethodSubtitle = (method: PaymentMethodConfig): string => {
  if (MOBILE_MONEY_METHODS.includes(method.name) && method.phoneNumber) {
    return method.phoneNumber;
  }
  if (method.name === 'bank_transfer' && method.iban) {
    return method.iban;
  }
  if (method.name === 'cash') {
    return 'Paiement en liquide';
  }
  return 'Transfert mobile';
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  invoiceId,
  invoiceNumber,
  onPaymentConfirm
}) => {
  const { showToast } = useToast();
  const [allMethods, setAllMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const configuredMethods = allMethods.filter(hasConfiguredDetails);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      setSelectedMethod(null);
      setTransactionReference('');
      setCopiedField(null);
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      const methods: PaymentMethodConfig[] = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        displayName: d.display_name,
        isActive: d.is_active,
        phoneNumber: d.phone_number,
        bankName: d.bank_name,
        iban: d.iban,
        accountHolder: d.account_holder,
        instructions: d.instructions,
        icon: d.icon,
        displayOrder: d.display_order,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));

      setAllMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !transactionReference.trim()) {
      showToast('Veuillez saisir la reference de transaction', 'error');
      return;
    }

    try {
      setSubmitting(true);

      if (onPaymentConfirm) {
        await onPaymentConfirm({
          paymentMethod: selectedMethod.name,
          transactionReference: transactionReference.trim()
        });
      }

      showToast('Votre declaration de paiement a ete enregistree', 'success');
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      showToast('Erreur lors de la confirmation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'smartphone':
        return Smartphone;
      case 'building-2':
      case 'building2':
        return Building2;
      case 'banknote':
        return Banknote;
      default:
        return Smartphone;
    }
  };

  const CopyButton: React.FC<{ text: string; field: string }> = ({ text, field }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
      style={{
        backgroundColor: copiedField === field ? '#ecfdf5' : '#f3f4f6',
        color: copiedField === field ? '#059669' : '#4b5563',
      }}
    >
      {copiedField === field ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copie !</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copier</span>
        </>
      )}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Payer mon abonnement</h2>
              {invoiceNumber && (
                <p className="text-sm text-gray-500 mt-0.5">Facture : {invoiceNumber}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Montant a regler</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(amount)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Chargement des modes de paiement...</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">
                Impossible de charger les modes de paiement
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Contactez le support pour connaitre les modalites de paiement.
              </p>
              <button
                onClick={loadPaymentMethods}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
              >
                Reessayer
              </button>
            </div>
          ) : configuredMethods.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">
                Aucun mode de paiement configure
              </p>
              <p className="text-sm text-gray-500">
                Contactez le support pour connaitre les modalites de paiement.
              </p>
            </div>
          ) : !selectedMethod ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Choisissez votre mode de paiement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {configuredMethods.map((method) => {
                  const IconComponent = getIconComponent(method.icon);
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                        <IconComponent className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{method.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {getMethodSubtitle(method)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = getIconComponent(selectedMethod.icon);
                    return <IconComponent className="w-5 h-5 text-orange-600" />;
                  })()}
                  <span className="font-semibold text-gray-900">
                    {selectedMethod.displayName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedMethod(null);
                    setTransactionReference('');
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Changer
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Instructions</h4>

                {MOBILE_MONEY_METHODS.includes(selectedMethod.name) && selectedMethod.phoneNumber && (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800">
                      Effectuez un transfert de <strong>{formatCurrency(amount)}</strong> vers le numero suivant :
                    </p>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                      <code className="font-mono text-lg font-semibold text-gray-900">
                        {selectedMethod.phoneNumber}
                      </code>
                      <CopyButton text={selectedMethod.phoneNumber} field="phone" />
                    </div>
                  </div>
                )}

                {selectedMethod.name === 'bank_transfer' && (
                  <div className="space-y-3">
                    <p className="text-sm text-blue-800">
                      Effectuez un virement de <strong>{formatCurrency(amount)}</strong> vers :
                    </p>
                    <div className="space-y-2">
                      {selectedMethod.bankName && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-gray-500 mb-0.5">Banque</p>
                          <p className="font-semibold text-gray-900">{selectedMethod.bankName}</p>
                        </div>
                      )}
                      {selectedMethod.accountHolder && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-gray-500 mb-0.5">Titulaire du compte</p>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{selectedMethod.accountHolder}</p>
                            <CopyButton text={selectedMethod.accountHolder} field="holder" />
                          </div>
                        </div>
                      )}
                      {selectedMethod.iban && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-gray-500 mb-0.5">IBAN</p>
                          <div className="flex items-center justify-between">
                            <code className="font-mono text-sm font-semibold text-gray-900">
                              {selectedMethod.iban}
                            </code>
                            <CopyButton text={selectedMethod.iban} field="iban" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedMethod.name === 'cash' && (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800">
                      Reglez <strong>{formatCurrency(amount)}</strong> en especes aupres de votre contact Ravito.
                    </p>
                    <p className="text-sm text-blue-800">
                      Demandez un recu et saisissez le numero de reference ci-dessous.
                    </p>
                  </div>
                )}

                {selectedMethod.instructions && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-blue-800">
                    <p className="whitespace-pre-wrap">{selectedMethod.instructions}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference de transaction *
                </label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder={
                    selectedMethod.name === 'cash'
                      ? 'Ex: RECU-2024-001'
                      : 'Ex: TXN123456789'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMethod.name === 'cash'
                    ? 'Saisissez le numero du recu remis par votre contact Ravito'
                    : 'Saisissez le numero de transaction recu apres le paiement'}
                </p>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={submitting || !transactionReference.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Confirmation en cours...
                  </>
                ) : (
                  'Confirmer mon paiement'
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <HelpCircle className="w-4 h-4" />
                <span>Besoin d'aide ? Contactez le support</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
