import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { InvoiceWithDetails, InvoiceStatus } from '../../../types/subscription';
import {
  formatCurrency,
  getInvoiceStatusName,
  getInvoiceStatusColor
} from '../../../types/subscription';
import { getAllInvoices } from '../../../services/admin/subscriptionAdminService';
import { useToast } from '../../../context/ToastContext';

export const InvoicesTab: React.FC = () => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const getStatusBadgeClass = (status: InvoiceStatus) => {
    const color = getInvoiceStatusColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => (i.totalPaid || 0) < i.amount && i.status !== 'overdue').length,
    paid: invoices.filter(i => (i.totalPaid || 0) >= i.amount).length,
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
          <option value="payment_submitted">Paiement declare</option>
          <option value="paid">Payees</option>
          <option value="overdue">En retard</option>
          <option value="cancelled">Annulees</option>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                    displayStatus = 'pending';
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
