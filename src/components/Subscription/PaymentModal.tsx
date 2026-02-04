import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, Building2, Banknote, HelpCircle } from 'lucide-react';
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

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  invoiceId,
  invoiceNumber,
  onPaymentConfirm
}) => {
  const { showToast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
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

      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      showToast('Erreur lors du chargement des modes de paiement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast('Copié dans le presse-papier', 'success');
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !transactionReference.trim()) {
      showToast('Veuillez sélectionner un mode de paiement et saisir la référence', 'error');
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
      
      showToast('Votre demande de paiement a été enregistrée', 'success');
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
      case 'building2':
        return Building2;
      case 'banknote':
        return Banknote;
      default:
        return Smartphone;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payer mon abonnement</h2>
              {invoiceNumber && (
                <p className="text-sm text-gray-600 mt-1">Facture: {invoiceNumber}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Montant */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Montant à régler</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(amount)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Sélection du mode de paiement */}
              {!selectedMethod ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Choisissez votre mode de paiement
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const IconComponent = getIconComponent(method.icon);
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method)}
                          className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{method.displayName}</p>
                            <p className="text-xs text-gray-600">
                              {method.name === 'cash' ? 'Paiement en liquide' : 
                               method.name === 'bank_transfer' ? 'Virement bancaire' : 
                               'Transfert mobile'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mode de paiement sélectionné */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
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
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Changer
                    </button>
                  </div>

                  {/* Instructions de paiement */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Instructions</h4>
                    
                    {/* Mobile Money (Wave, Orange Money, MTN Money) */}
                    {selectedMethod.phoneNumber && (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-800">
                          Effectuez un transfert de <strong>{formatCurrency(amount)}</strong> vers le numéro suivant :
                        </p>
                        <div className="flex items-center space-x-2 bg-white rounded p-3">
                          <code className="flex-1 font-mono text-lg font-semibold text-gray-900">
                            {selectedMethod.phoneNumber}
                          </code>
                          <button
                            onClick={() => handleCopy(selectedMethod.phoneNumber!, 'phone')}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Virement bancaire */}
                    {selectedMethod.bankName && (
                      <div className="space-y-3">
                        <p className="text-sm text-blue-800 mb-2">
                          Effectuez un virement de <strong>{formatCurrency(amount)}</strong> vers :
                        </p>
                        <div className="space-y-2">
                          <div className="bg-white rounded p-3">
                            <p className="text-xs text-gray-600">Banque</p>
                            <p className="font-semibold text-gray-900">{selectedMethod.bankName}</p>
                          </div>
                          {selectedMethod.iban && (
                            <div className="bg-white rounded p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-600">IBAN</p>
                                  <code className="font-mono text-sm font-semibold text-gray-900">
                                    {selectedMethod.iban}
                                  </code>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedMethod.iban!, 'iban')}
                                  className="p-2 hover:bg-gray-100 rounded"
                                >
                                  {copiedField === 'iban' ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Copy className="w-5 h-5 text-gray-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {selectedMethod.accountHolder && (
                            <div className="bg-white rounded p-3">
                              <p className="text-xs text-gray-600">Titulaire</p>
                              <p className="font-semibold text-gray-900">{selectedMethod.accountHolder}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Instructions personnalisées */}
                    {selectedMethod.instructions && (
                      <div className="mt-3 text-sm text-blue-800">
                        <p className="whitespace-pre-wrap">{selectedMethod.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Champ de référence de transaction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de référence de transaction *
                    </label>
                    <input
                      type="text"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      placeholder="Ex: TXN123456789"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Saisissez le numéro de transaction que vous avez reçu après le paiement
                    </p>
                  </div>

                  {/* Bouton de confirmation */}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={submitting || !transactionReference.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

                  {/* Lien support */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <HelpCircle className="w-4 h-4" />
                    <span>Besoin d'aide ?</span>
                    <button
                      onClick={() => {
                        // TODO: Ouvrir le support ou naviguer vers la page support
                        showToast('Fonction support à venir', 'info');
                      }}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Contactez le support
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
