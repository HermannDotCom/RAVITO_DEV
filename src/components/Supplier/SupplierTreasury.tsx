import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Calendar,
  Download,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommission } from '../../context/CommissionContext';
import {
  getSupplierFinancialSummary,
  getSupplierTransactionHistory,
  getSupplierMonthlyStats,
  getPendingTransfers,
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

export const SupplierTreasury: React.FC = () => {
  const { user } = useAuth();
  const { commissionSettings } = useCommission();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [transferFilter, setTransferFilter] = useState<'all' | 'pending' | 'transferred'>('all');
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<{
    count: number;
    totalAmount: number;
    orders: { id: string; amount: number; deliveredAt: Date }[];
  }>({ count: 0, totalAmount: 0, orders: [] });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period, transferFilter, selectedYear]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [summaryData, transactionData, statsData, pendingData] = await Promise.all([
        getSupplierFinancialSummary(user.id, period),
        getSupplierTransactionHistory(user.id, { 
          period: period as any,
          transferStatus: transferFilter
        }),
        getSupplierMonthlyStats(user.id, selectedYear),
        getPendingTransfers(user.id)
      ]);

      setSummary(summaryData);
      setTransactions(transactionData);
      setMonthlyStats(statsData);
      setPendingTransfers(pendingData);
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
      const filename = `tresorerie_fournisseur_${new Date().toISOString().split('T')[0]}`;
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

  const transferFilters = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'transferred', label: 'Virés' }
  ];

  const monthlyColumns = [
    { key: 'monthName', label: 'Mois', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Livraisons', align: 'center' as const },
    { key: 'totalHT', label: 'Revenus Bruts', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'netAmount', label: 'Revenus Nets', align: 'right' as const, format: formatPrice }
  ];

  const quarterlyColumns = [
    { key: 'quarter', label: 'Trimestre', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Livraisons', align: 'center' as const },
    { key: 'totalHT', label: 'Revenus Bruts', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'netAmount', label: 'Revenus Nets', align: 'right' as const, format: formatPrice }
  ];

  const yearlyColumns = [
    { key: 'year', label: 'Année', align: 'left' as const },
    { key: 'orderCount', label: 'Nb Livraisons', align: 'center' as const },
    { key: 'totalHT', label: 'Revenus Bruts', align: 'right' as const, format: formatPrice },
    { key: 'commissions', label: 'Commissions', align: 'right' as const, format: formatPrice },
    { key: 'netAmount', label: 'Revenus Nets', align: 'right' as const, format: formatPrice }
  ];

  // Prepare chart data for bar chart
  const chartData = monthlyStats.map(stat => ({
    label: stat.monthName.substring(0, 3),
    value: stat.netAmount || 0
  }));

  // Prepare donut chart data for comparison
  const donutData = summary ? [
    { label: 'Revenus Nets', value: summary.totalNet, color: '#22C55E' },
    { label: `Commissions (${commissionSettings.supplierCommission}%)`, value: summary.totalCommissions, color: '#F97316' }
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
          <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trésorerie</h1>
            <p className="text-gray-600">Consultez vos revenus et virements</p>
          </div>
        </div>
      </div>

      {/* Pending Transfers Alert */}
      {pendingTransfers.count > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Virements en attente</h3>
              <p className="text-yellow-800 text-sm">
                Vous avez <strong>{pendingTransfers.count}</strong> livraison(s) en attente de virement pour un total de{' '}
                <strong>{formatPrice(pendingTransfers.totalAmount)}</strong>.
                Les virements sont généralement effectués sous 24-48h après la livraison.
              </p>
            </div>
          </div>
        </div>
      )}

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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          title="Revenus Bruts"
          value={formatPrice(summary?.totalAmount || 0)}
          subtitle="Total des ventes"
          icon={DollarSign}
          gradient="blue"
        />
        <FinancialCard
          title="Commissions Prélevées"
          value={formatPrice(summary?.totalCommissions || 0)}
          subtitle={`${commissionSettings.supplierCommission}% de commission`}
          icon={TrendingDown}
          gradient="orange"
        />
        <FinancialCard
          title="Revenus Nets"
          value={formatPrice(summary?.totalNet || 0)}
          subtitle="Montant effectivement reçu"
          icon={TrendingUp}
          gradient="green"
        />
        <FinancialCard
          title="En Attente de Virement"
          value={formatPrice(summary?.pendingTransferAmount || 0)}
          subtitle={`${pendingTransfers.count} livraison(s)`}
          icon={Clock}
          gradient="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleBarChart
          data={chartData}
          title="Évolution des revenus mensuels"
          formatValue={formatPrice}
        />
        <SimpleDonutChart
          data={donutData}
          title="Revenus Bruts vs Net vs Commissions"
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
            <div className="flex flex-wrap items-center gap-4">
              {/* Transfer Status Filter */}
              <div className="flex gap-2">
                {transferFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setTransferFilter(filter.value as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      transferFilter === filter.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
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
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucune transaction"
              description="Vos transactions apparaîtront ici une fois vos premières livraisons effectuées"
            />
          ) : (
            <TransactionList
              transactions={transactions}
              isSupplier={true}
            />
          )}
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Informations sur les virements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">Délai de virement</p>
            <p>Les virements sont effectués sous 24 à 48 heures après la confirmation de livraison.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Commission plateforme</p>
            <p>Une commission de {commissionSettings.supplierCommission}% est prélevée sur chaque transaction pour les frais de plateforme.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Confidentialité client</p>
            <p>Les informations client ne sont visibles qu'après le paiement de la commande.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Questions?</p>
            <p>Contactez notre support pour toute question concernant vos virements.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
