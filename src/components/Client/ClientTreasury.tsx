import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Package, 
  ShoppingCart,
  Calendar,
  Download,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommission } from '../../context/CommissionContext';
import {
  getClientFinancialSummary,
  getClientTransactionHistory,
  getClientMonthlyStats,
  exportTransactionsToCSV,
  aggregateToQuarterly,
  aggregateToYearly,
  FinancialSummary,
  MonthlyStats,
  TransactionRecord
} from '../../services/treasuryService';
import {
  FinancialCard,
  PeriodFilter,
  ViewModeTabs,
  StatsTable,
  TransactionList,
  SimpleBarChart,
  SimpleDonutChart,
  LoadingSpinner,
  EmptyState
} from '../shared/TreasuryComponents';

export const ClientTreasury: React.FC = () => {
  const { user } = useAuth();
  const { commissionSettings } = useCommission();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period, selectedYear]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [summaryData, transactionData, statsData] = await Promise.all([
        getClientFinancialSummary(user.id, period),
        getClientTransactionHistory(user.id, { period: period as any }),
        getClientMonthlyStats(user.id, selectedYear)
      ]);

      setSummary(summaryData);
      setTransactions(transactionData);
      setMonthlyStats(statsData);
    } catch (error) {
      console.error('Error loading treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const handleExport = () => {
    if (transactions.length > 0) {
      const filename = `tresorerie_client_${new Date().toISOString().split('T')[0]}`;
      exportTransactionsToCSV(transactions, filename);
    }
  };

  const getQuarterlyStats = () => {
    return aggregateToQuarterly(monthlyStats).map(q => ({
      ...q,
      quarter: `T${q.quarter}`
    }));
  };

  const getYearlyStats = () => {
    const yearly = aggregateToYearly(monthlyStats);
    return [yearly];
  };

  const viewTabs = [
    { id: 'monthly', label: 'Mensuel' },
    { id: 'quarterly', label: 'Trimestriel' },
    { id: 'yearly', label: 'Annuel' }
  ];

  const monthlyColumns = [
    { key: 'monthName', label: 'Mois', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Commandes', align: 'center' as const },
    { key: 'totalHT', label: 'Total HT', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'totalTTC', label: 'Total TTC', align: 'right' as const, format: formatPrice }
  ];

  const quarterlyColumns = [
    { key: 'quarter', label: 'Trimestre', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Commandes', align: 'center' as const },
    { key: 'totalHT', label: 'Total HT', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'totalTTC', label: 'Total TTC', align: 'right' as const, format: formatPrice }
  ];

  const yearlyColumns = [
    { key: 'year', label: 'Année', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Commandes', align: 'center' as const },
    { key: 'totalHT', label: 'Total HT', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'totalTTC', label: 'Total TTC', align: 'right' as const, format: formatPrice }
  ];

  // Prepare chart data
  const chartData = monthlyStats.map(stat => ({
    label: stat.monthName.substring(0, 3),
    value: stat.totalTTC
  }));

  const donutData = summary ? [
    { label: 'Montant Produits', value: summary.totalNet, color: '#3B82F6' },
    { label: `Commissions (${commissionSettings.clientCommission}%)`, value: summary.totalCommissions, color: '#F97316' }
  ] : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <LoadingSpinner message="Chargement de vos données financières..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trésorerie</h1>
            <p className="text-gray-600">Consultez vos dépenses et commissions</p>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PeriodFilter
            selectedPeriod={period}
            onPeriodChange={setPeriod}
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Année:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {[0, 1, 2].map(offset => {
                const year = new Date().getFullYear() - offset;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FinancialCard
          title="Total Dépensé"
          value={formatPrice(summary?.totalAmount || 0)}
          subtitle="Montant total des commandes"
          icon={CreditCard}
          gradient="orange"
        />
        <FinancialCard
          title="Commissions Versées"
          value={formatPrice(summary?.totalCommissions || 0)}
          subtitle={`${commissionSettings.clientCommission}% de commission`}
          icon={TrendingUp}
          gradient="blue"
        />
        <FinancialCard
          title="Nombre de Commandes"
          value={String(summary?.orderCount || 0)}
          subtitle="Commandes complétées"
          icon={Package}
          gradient="green"
        />
        <FinancialCard
          title="Panier Moyen"
          value={formatPrice(summary?.averageOrderValue || 0)}
          subtitle="Montant moyen par commande"
          icon={ShoppingCart}
          gradient="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleBarChart
          data={chartData}
          title="Évolution des dépenses mensuelles"
          formatValue={formatPrice}
        />
        <SimpleDonutChart
          data={donutData}
          title="Répartition des dépenses"
          formatValue={formatPrice}
        />
      </div>

      {/* Periodic Summary */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Récapitulatifs Périodiques</h2>
            <ViewModeTabs
              activeTab={viewMode}
              onTabChange={setViewMode}
              tabs={viewTabs}
            />
          </div>
        </div>
        <div className="p-6">
          {viewMode === 'monthly' && (
            <StatsTable
              columns={monthlyColumns}
              data={monthlyStats}
              emptyMessage="Aucune donnée pour cette année"
            />
          )}
          {viewMode === 'quarterly' && (
            <StatsTable
              columns={quarterlyColumns}
              data={getQuarterlyStats()}
              emptyMessage="Aucune donnée pour cette année"
            />
          )}
          {viewMode === 'yearly' && (
            <StatsTable
              columns={yearlyColumns}
              data={getYearlyStats()}
              emptyMessage="Aucune donnée pour cette année"
            />
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Historique des Transactions</h2>
              <p className="text-sm text-gray-600">
                {transactions.length} transaction(s) trouvée(s)
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exporter CSV</span>
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucune transaction"
              description="Vos transactions apparaîtront ici une fois vos premières commandes effectuées"
            />
          ) : (
            <TransactionList
              transactions={transactions}
              isSupplier={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
