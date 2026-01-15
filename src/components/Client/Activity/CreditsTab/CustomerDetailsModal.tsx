import React, { useState } from 'react';
import { X, User, Phone, MapPin, Calendar, TrendingUp, TrendingDown, FileText, Eye } from 'lucide-react';
import { CreditCustomer, CreditTransaction, CreditTransactionItem, PAYMENT_METHOD_LABELS } from '../../../../types/activity';
import { useCustomerDetails } from '../hooks/useCustomerDetails';

interface CustomerDetailsModalProps {
  customer: CreditCustomer;
  onClose: () => void;
}

type FilterType = 'all' | 'week' | 'month';

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  onClose,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const { transactions, loading } = useCustomerDetails({ customerId: customer.id });

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterTransactions = () => {
    if (filter === 'all') return transactions;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (filter === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }
    
    return transactions.filter((t) => new Date(t.transactionDate) >= cutoffDate);
  };

  const filteredTransactions = filterTransactions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
              <p className="text-sm text-slate-600">Détails du client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <h4 className="font-bold text-slate-900 mb-3">Informations</h4>
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{customer.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Client depuis le {formatDate(customer.createdAt)}</span>
            </div>
            {customer.notes && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Notes:</p>
                <p className="text-sm text-slate-700">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Statistics */}
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
              <div className="text-xs text-purple-600 font-medium mb-1">Plafond</div>
              <div className="text-lg font-bold text-purple-900">
                {customer.creditLimit > 0 ? formatCurrency(customer.creditLimit) : '∞'}
              </div>
              <div className="text-xs text-purple-600">FCFA</div>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Historique des transactions
              </h4>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setFilter('month')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filter === 'month'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => setFilter('week')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filter === 'week'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semaine
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-500">Aucune transaction trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {transaction.transactionType === 'consumption' ? (
                              <TrendingUp className="w-4 h-4 text-orange-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            )}
                            <span className="font-medium text-slate-900">
                              {transaction.transactionType === 'consumption'
                                ? 'Consommation'
                                : 'Règlement'}
                            </span>
                            {transaction.transactionType === 'payment' && transaction.paymentMethod && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDateTime(transaction.createdAt)}
                          </div>
                          {transaction.notes && (
                            <div className="text-xs text-slate-600 mt-1">{transaction.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              transaction.transactionType === 'consumption'
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {transaction.transactionType === 'consumption' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-slate-500">FCFA</div>
                        </div>
                      </div>
                      
                      {/* Show items for consumption */}
                      {transaction.transactionType === 'consumption' && transaction.items && transaction.items.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedTransaction(
                              expandedTransaction === transaction.id ? null : transaction.id
                            )
                          }
                          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            {expandedTransaction === transaction.id ? 'Masquer' : 'Voir'} les articles
                            ({transaction.items.length})
                          </span>
                        </button>
                      )}
                    </div>
                    
                    {/* Expanded items */}
                    {expandedTransaction === transaction.id && transaction.items && (
                      <div className="bg-slate-50 border-t border-slate-200 p-3">
                        <div className="space-y-1">
                          {transaction.items.map((item: CreditTransactionItem) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm text-slate-700"
                            >
                              <span>
                                {item.productName} × {item.quantity}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.subtotal)} FCFA
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
