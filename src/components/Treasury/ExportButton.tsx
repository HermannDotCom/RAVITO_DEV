import React from 'react';
import { Download } from 'lucide-react';
import type { Transaction } from './index';

interface ExportButtonProps {
  transactions: Transaction[];
  filename?: string;
  isSupplier?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  transactions,
  filename = 'transactions',
  isSupplier = false
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getTypeLabel = (type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      recharge: 'Recharge',
      purchase: 'Achat',
      refund: 'Remboursement',
      sale: 'Vente',
      commission: 'Commission',
      withdrawal: 'Retrait',
      bonus: 'Bonus'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: Transaction['status']) => {
    const labels: Record<Transaction['status'], string> = {
      completed: 'Complété',
      pending: 'En attente',
      failed: 'Échoué'
    };
    return labels[status] || status;
  };

  const handleExport = () => {
    if (transactions.length === 0) return;

    let headers: string[];
    let rows: string[][];

    if (isSupplier) {
      headers = ['Date', 'N° Commande', 'Description', 'Montant Brut', 'Commission', 'Montant Net', 'Type', 'Statut'];
      rows = transactions.map(t => [
        formatDate(t.date),
        t.order_id || '-',
        t.description,
        t.amount.toFixed(0),
        (t.commission || 0).toFixed(0),
        (t.net_amount || t.amount).toFixed(0),
        getTypeLabel(t.type),
        getStatusLabel(t.status)
      ]);
    } else {
      headers = ['Date', 'Description', 'Montant', 'Type', 'Statut'];
      rows = transactions.map(t => [
        formatDate(t.date),
        t.description,
        t.amount.toFixed(0),
        getTypeLabel(t.type),
        getStatusLabel(t.status)
      ]);
    }

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={transactions.length === 0}
      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="h-4 w-4" />
      <span>Exporter CSV</span>
    </button>
  );
};
