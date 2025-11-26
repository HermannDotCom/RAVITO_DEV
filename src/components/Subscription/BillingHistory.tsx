/**
 * Billing History Component
 * 
 * Displays invoice history with download options
 */

import React from 'react';
import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Invoice } from '../../types';

interface BillingHistoryProps {
  invoices: Invoice[];
  loading?: boolean;
}

const statusConfig = {
  paid: {
    label: 'Payé',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  failed: {
    label: 'Échoué',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};

export const BillingHistory: React.FC<BillingHistoryProps> = ({
  invoices,
  loading = false
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          Historique de facturation
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          Historique de facturation
        </h3>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune facture disponible</p>
          <p className="text-sm text-gray-400 mt-1">
            Vos factures apparaîtront ici après votre première souscription
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-orange-500" />
        Historique de facturation
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Montant
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Statut
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;

              return (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                    {formatPrice(invoice.amount)}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${status.bgColor} ${status.color}
                      `}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
