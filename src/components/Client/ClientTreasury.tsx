import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Package, 
  ShoppingCart,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Search,
  X
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
  SimpleDonutChart,
  LoadingSpinner,
  EmptyState
} from '../shared/TreasuryComponents';
import { BalanceChart } from '../Treasury/BalanceChart';
import { RechargeModal } from '../Treasury/RechargeModal';

export const ClientTreasury: React.FC = () => {
  const { user } = useAuth();
  const { commissionSettings } = useCommission();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [showRechargeModal, setShowRechargeModal] = useState(false);

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
    if (filteredTransactions.length > 0) {
      const filename = `tresorerie_client_${new Date().toISOString().split('T')[0]}`;
      exportTransactionsToCSV(filteredTransactions, filename);
    }
  };

  const handleRecharge = (amount: number) => {
    // In production, would call API to process recharge
    console.log('Recharge requested:', amount);
    // Reload data after recharge
    loadData();
  };

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.orderNumber.toLowerCase().includes(query) ||
      t.counterpartyName.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Calculate variation compared to previous period
  const variationPercent = useMemo(() => {
    if (monthlyStats.length < 2) return 0;
    const currentMonth = monthlyStats[monthlyStats.length - 1]?.totalTTC || 0;
    const previousMonth = monthlyStats[monthlyStats.length - 2]?.totalTTC || 0;
    if (previousMonth === 0) return 0;
    return ((currentMonth - previousMonth) / previousMonth) * 100;
  }, [monthlyStats]);

  // Prepare chart data for Recharts
  const balanceChartData = useMemo(() => {
    return monthlyStats.map(stat => ({
      date: stat.monthName.substring(0, 3),
      balance: stat.totalTTC
    }));
  }, [monthlyStats]);

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-0">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <LoadingSpinner message="Chargement de vos données financières..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-0">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Trésorerie</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">Consultez vos dépenses et commissions</p>
            </div>
          </div>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm sm:text-base">Recharger mon compte</span>
          </button>
        </div>
      </div>

      {/* Balance Card with Variation Indicator */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-orange-100 text-xs sm:text-sm font-medium">Total Dépensé</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{formatPrice(summary?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1 w-fit">
          {variationPercent > 0 ? (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          ) : variationPercent < 0 ? (
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          ) : (
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          )}
          <span className="text-xs sm:text-sm font-medium text-white">
            {variationPercent > 0 ? '+' : ''}{variationPercent.toFixed(1)}% vs mois dernier
          </span>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <PeriodFilter
            selectedPeriod={period}
            onPeriodChange={setPeriod}
          />
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Année:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex-1 sm:flex-initial"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <BalanceChart
          data={balanceChartData}
          title="Évolution des dépenses mensuelles"
          formatPrice={formatPrice}
        />
        <SimpleDonutChart
          data={donutData}
          title="Répartition des dépenses"
          formatValue={formatPrice}
        />
      </div>

      {/* Periodic Summary */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 sm:mb-6 md:mb-8 overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Récapitulatifs Périodiques</h2>
            <ViewModeTabs
              activeTab={viewMode}
              onTabChange={setViewMode}
              tabs={viewTabs}
            />
          </div>
        </div>
        <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Historique des Transactions</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {filteredTransactions.length} transaction(s) trouvée(s)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {filteredTransactions.length > 0 && (
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
        <div className="p-3 sm:p-4 md:p-6">
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchQuery ? "Aucun résultat" : "Aucune transaction"}
              description={searchQuery ? "Aucune transaction correspondant à votre recherche" : "Vos transactions apparaîtront ici une fois vos premières commandes effectuées"}
            />
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              isSupplier={false}
            />
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onConfirm={handleRecharge}
        formatPrice={formatPrice}
      />
      </div>
    </div>
  );
};
