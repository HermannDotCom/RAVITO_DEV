import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  DollarSign, 
  Clock,
  TrendingUp,
  ArrowLeft,
  Banknote
} from 'lucide-react';
import { TransactionFilters } from '../components/Treasury/TransactionFilters';
import { TransactionList } from '../components/Treasury/TransactionList';
import type { Transaction } from '../components/Treasury';
import { RevenueChart } from '../components/Treasury/RevenueChart';
import { WithdrawModal } from '../components/Treasury/WithdrawModal';
import { ExportButton } from '../components/Treasury/ExportButton';

// Mock data generator for supplier transactions
const generateMockSupplierTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const clientNames = [
    'Bar Le Terminus',
    'Restaurant Chez Paul',
    'Maquis La Détente',
    'Hotel Palm Beach',
    'Superette ABC',
    'Snack Le Coin',
    'Club Nuit Blanche',
    'Café Central'
  ];
  
  const now = new Date();
  const commissionRate = 0.05; // 5% commission
  
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const typeRand = Math.random();
    let type: Transaction['type'];
    let amount: number;
    let commission: number | undefined;
    let net_amount: number | undefined;
    
    if (typeRand < 0.75) {
      type = 'sale';
      amount = Math.floor(Math.random() * 200000) + 20000;
      commission = Math.round(amount * commissionRate);
      net_amount = amount - commission;
    } else if (typeRand < 0.85) {
      type = 'withdrawal';
      amount = Math.floor(Math.random() * 100000) + 50000;
    } else if (typeRand < 0.95) {
      type = 'commission';
      amount = Math.floor(Math.random() * 10000) + 1000;
    } else {
      type = 'bonus';
      amount = [5000, 10000, 15000][Math.floor(Math.random() * 3)];
    }
    
    transactions.push({
      id: `tx-${i + 1}`,
      date: date.toISOString(),
      description: type === 'sale' 
        ? `Vente à ${clientNames[Math.floor(Math.random() * clientNames.length)]}`
        : type === 'withdrawal'
        ? 'Retrait vers compte bancaire'
        : type === 'bonus'
        ? 'Bonus performance du mois'
        : 'Commission prélevée',
      amount,
      type,
      status: Math.random() > 0.15 ? 'completed' : 'pending',
      order_id: type === 'sale' ? `CMD-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
      commission,
      net_amount
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock monthly revenue data for chart
const generateMonthlyRevenue = () => {
  const data: { month: string; revenue: number; commission: number }[] = [];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const revenue = Math.floor(Math.random() * 500000) + 100000;
    const commission = Math.round(revenue * 0.05);
    
    data.push({
      month: months[monthIndex],
      revenue: revenue - commission,
      commission
    });
  }
  
  return data;
};

const mockTransactions = generateMockSupplierTransactions();
const mockMonthlyRevenue = generateMonthlyRevenue();

interface TreasurySupplierProps {
  onBack?: () => void;
}

export const TreasurySupplier: React.FC<TreasurySupplierProps> = ({ onBack }) => {
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  // Calculate stats from transactions
  const stats = useMemo(() => {
    const sales = mockTransactions.filter(t => t.type === 'sale' && t.status === 'completed');
    const pendingSales = mockTransactions.filter(t => t.type === 'sale' && t.status === 'pending');
    const withdrawals = mockTransactions.filter(t => t.type === 'withdrawal' && t.status === 'completed');
    
    const totalEarned = sales.reduce((sum, t) => sum + (t.net_amount || 0), 0);
    const pendingAmount = pendingSales.reduce((sum, t) => sum + (t.net_amount || 0), 0);
    const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const availableBalance = totalEarned - totalWithdrawn;
    
    // This month's earnings
    const now = new Date();
    const thisMonthSales = sales.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const monthEarned = thisMonthSales.reduce((sum, t) => sum + (t.net_amount || 0), 0);
    
    return {
      availableBalance,
      pendingAmount,
      totalEarned,
      monthEarned
    };
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...mockTransactions];
    
    // Period filter
    const now = new Date();
    let startDate: Date;
    switch (periodFilter) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }
    filtered = filtered.filter(t => new Date(t.date) >= startDate);
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.order_id?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [periodFilter, typeFilter, searchQuery]);

  const transactionTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'sale', label: 'Vente' },
    { value: 'commission', label: 'Commission' },
    { value: 'withdrawal', label: 'Retrait' },
    { value: 'bonus', label: 'Bonus' }
  ];

  const handleWithdraw = (amount: number) => {
    // In real app, would call API
    console.log('Withdrawal requested:', amount);
  };

  // Mock bank info
  const bankInfo = {
    iban: 'CI** **** **** 7890',
    bankName: 'SGBCI',
    accountHolder: 'Entreprise ABC'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-0">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Trésorerie</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérez vos revenus et retraits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Solde Disponible</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 break-words">{formatPrice(stats.availableBalance)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Retirable maintenant</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={stats.availableBalance < 50000}
            className="mt-3 sm:mt-4 w-full py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Demander un retrait
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">En Attente</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 break-words">{formatPrice(stats.pendingAmount)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Commandes en cours</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total des Gains</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{formatPrice(stats.totalEarned)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Depuis inscription</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Gains du Mois</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{formatPrice(stats.monthEarned)}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Ce mois-ci</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <RevenueChart
          data={mockMonthlyRevenue}
          title="Revenus des 6 derniers mois"
          formatPrice={formatPrice}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6">
        <TransactionFilters
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          transactionTypes={transactionTypes}
        />
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 sm:mb-6 md:mb-8">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Historique des Transactions</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {filteredTransactions.length} transaction(s) trouvée(s)
              </p>
            </div>
            <ExportButton
              transactions={filteredTransactions}
              filename="tresorerie_fournisseur"
              isSupplier={true}
            />
          </div>
        </div>
        <div className="p-3 sm:p-4 md:p-6">
          <TransactionList
            transactions={filteredTransactions}
            isSupplier={true}
            formatPrice={formatPrice}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Informations sur les retraits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">Montant minimum</p>
            <p>Le montant minimum de retrait est de 50 000 FCFA.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Délai de traitement</p>
            <p>Les virements sont effectués sous 3 à 5 jours ouvrés.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Commission</p>
            <p>Une commission de 5% est prélevée sur chaque vente.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Questions?</p>
            <p>Contactez notre support pour toute question concernant vos virements.</p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onConfirm={handleWithdraw}
        availableBalance={stats.availableBalance}
        bankInfo={bankInfo}
        formatPrice={formatPrice}
      />
      </div>
    </div>
  );
};

export default TreasurySupplier;
