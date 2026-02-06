import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, X } from 'lucide-react';
import type { InvoiceWithDetails, InvoiceStatus, PaymentMethod } from '../../../types/subscription';
import {
  formatCurrency,
  getInvoiceStatusName,
  getInvoiceStatusColor
} from '../../../types/subscription';
import { getAllInvoices, adminValidatePayment } from '../../../services/admin/subscriptionAdminService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const InvoicesTab: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [validatingInvoiceId, setValidatingInvoiceId] = useState<string | null>(null);

  // Modal de validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    transactionReference: '',
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('Erreur lors du chargement des factures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => {
        const amountDue = i.amount;
        const amountPaid = i.totalPaid || 0;
        
        if (statusFilter === 'paid') return amountPaid >= amountDue;
        if (statusFilter === 'pending') return amountPaid < amountDue && i.status !== 'overdue';
        return i.status === statusFilter;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.subscription.organizationName.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleOpenValidation = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.remainingAmount,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      transactionReference: '',
      notes: ''
    });
    setShowValidationModal(true);
  };

  const handleCloseValidation = () => {
    setShowValidationModal(false);
    setSelectedInvoice(null);
    setPaymentData({
      amount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      transactionReference: '',
      notes: ''
    });
  };

  const handleValidatePayment = async () => {
    if (!selectedInvoice || !user?.id) return;

    try {
      setValidatingInvoiceId(selectedInvoice.id);

      await adminValidatePayment(
        {
          invoiceId: selectedInvoice.id,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          paymentDate: new Date(paymentData.paymentDate),
          receiptNumber: paymentData.receiptNumber || undefined,
          transactionReference: paymentData.transactionReference || undefined,
          notes: paymentData.notes || undefined
        },
        user.id
      );

      showToast('Paiement validé avec succès', 'success');
      handleCloseValidation();
      await loadInvoices();
    } catch (error) {
      console.error('Error validating payment:', error);
      showToast('Erreur lors de la validation du paiement', 'error');
    } finally {
      setValidatingInvoiceId(null);
    }
  };

  const getStatusBadgeClass = (status: InvoiceStatus) => {
    const color = getInvoiceStatusColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices.reduce((sum, i) => sum + (i.totalPaid || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total factures</div>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="text-2xl font-bold text-orange-900">{stats.pending}</div>
          <div className="text-sm text-orange-700">En attente</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-900">{stats.paid}</div>
          <div className="text-sm text-green-700">Payées</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-xl font-bold text-blue-900">{formatCurrency(stats.paidAmount)}</div>
          <div className="text-sm text-blue-700">Revenus</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par numéro ou organisation..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="paid">Payées</option>
          <option value="overdue">En retard</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Organisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Montant Dû
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Montant Réglé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Échéance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const amountDue = invoice.amount;
                  const amountPaid = invoice.totalPaid || 0;
                  const remainingAmount = invoice.remainingAmount;
                  
                  // Calculer le statut basé sur les montants
                  let displayStatus = invoice.status;
                  if (amountPaid >= amountDue) {
                    displayStatus = 'paid';
                  } else if (amountPaid > 0 && amountPaid < amountDue) {
                    displayStatus = 'pending'; // Or keep original if preferred
                  }

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {invoice.subscription.organizationName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          {new Date(invoice.periodStart).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </div>
                        {invoice.isProrata && (
                          <div className="text-xs text-orange-600">
                            Prorata ({invoice.daysCalculated}j)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(amountDue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-semibold ${amountPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatCurrency(amountPaid)}
                        </div>
                        {amountPaid > 0 && amountPaid < amountDue && (
                          <div className="text-xs text-orange-600">
                            Reste: {formatCurrency(remainingAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(displayStatus)}`}>
                          {amountPaid > 0 && amountPaid < amountDue ? 'Partiel' : getInvoiceStatusName(displayStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                          <button
                            onClick={() => handleOpenValidation(invoice)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valider paiement
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Modal */}
      {showValidationModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Valider le paiement</h3>
              <button
                onClick={handleCloseValidation}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informations facture */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Facture:</div>
                  <div className="font-semibold">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-gray-600">Organisation:</div>
                  <div className="font-semibold">{selectedInvoice.subscription.organizationName}</div>
                  <div className="text-gray-600">Montant:</div>
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(selectedInvoice.amount)}
                  </div>
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant reçu
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Montant"
                />
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode de paiement
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="cash">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                </select>
              </div>

              {/* Date de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de paiement
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Numéro de reçu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de reçu (optionnel)
                </label>
                <input
                  type="text"
                  value={paymentData.receiptNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: REC-001"
                />
              </div>

              {/* Référence transaction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence transaction (optionnel)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionReference}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: TXN123456"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseValidation}
                disabled={validatingInvoiceId !== null}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleValidatePayment}
                disabled={validatingInvoiceId !== null || paymentData.amount <= 0}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {validatingInvoiceId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Validation...
                  </>
                ) : (
                  'Valider le paiement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
