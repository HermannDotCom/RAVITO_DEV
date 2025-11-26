import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Package, 
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';
import { BalanceCard } from '../components/Treasury/BalanceCard';
import { TransactionFilters } from '../components/Treasury/TransactionFilters';
import { TransactionList } from '../components/Treasury/TransactionList';
import type { Transaction } from '../components/Treasury';
import { BalanceChart } from '../components/Treasury/BalanceChart';
import { RechargeModal } from '../components/Treasury/RechargeModal';
import { ExportButton } from '../components/Treasury/ExportButton';

// Mock data generator for client transactions
const generateMockClientTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const descriptions = [
    'Achat casier Bière Flag',
    'Achat pack Coca-Cola',
    'Recharge compte',
    'Achat casier Beaufort',
    'Remboursement commande annulée',
    'Achat bouteille Champagne',
    'Achat pack eau Awa',
    'Recharge Mobile Money'
  ];
  
  const now = new Date();
  
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const typeRand = Math.random();
    let type: Transaction['type'];
    let amount: number;
    
    if (typeRand < 0.15) {
      type = 'recharge';
      amount = [10000, 20000, 50000, 100000][Math.floor(Math.random() * 4)];
    } else if (typeRand < 0.95) {
      type = 'purchase';
      amount = Math.floor(Math.random() * 150000) + 10000;
    } else {
      type = 'refund';
      amount = Math.floor(Math.random() * 50000) + 5000;
    }
    
    transactions.push({
      id: `tx-${i + 1}`,
      date: date.toISOString(),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      amount,
      type,
      status: Math.random() > 0.1 ? 'completed' : 'pending',
      order_id: type !== 'recharge' ? `CMD-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock balance history for chart
const generateBalanceHistory = () => {
  const data: { date: string; balance: number }[] = [];
  let balance = 150000;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const change = (Math.random() - 0.3) * 20000;
    balance = Math.max(0, balance + change);
    
    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      balance: Math.round(balance)
    });
  }
  
  return data;
};

const mockTransactions = generateMockClientTransactions();
const mockBalanceHistory = generateBalanceHistory();

interface TreasuryClientProps {
  onBack?: () => void;
}

export const TreasuryClient: React.FC<TreasuryClientProps> = ({ onBack }) => {
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [balance, setBalance] = useState(mockBalanceHistory[mockBalanceHistory.length - 1]?.balance || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  // Calculate variation compared to last month
  const variationPercent = useMemo(() => {
    const currentBalance = balance;
    const lastMonthBalance = mockBalanceHistory[0]?.balance || balance;
    if (lastMonthBalance === 0) return 0;
    return ((currentBalance - lastMonthBalance) / lastMonthBalance) * 100;
  }, [balance]);

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

  // Calculate stats
  const stats = useMemo(() => {
    const purchases = mockTransactions.filter(t => t.type === 'purchase' && t.status === 'completed');
    const totalSpent = purchases.reduce((sum, t) => sum + t.amount, 0);
    const orderCount = purchases.length;
    
    return {
      totalSpent,
      orderCount,
      averageOrder: orderCount > 0 ? totalSpent / orderCount : 0
    };
  }, []);

  const transactionTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'recharge', label: 'Recharge' },
    { value: 'purchase', label: 'Achat' },
    { value: 'refund', label: 'Remboursement' }
  ];

  const handleRecharge = (amount: number) => {
    setBalance(prev => prev + amount);
    // In real app, would call API
    console.log('Recharged:', amount);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trésorerie</h1>
              <p className="text-gray-600">Gérez votre solde et vos transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mb-8">
        <BalanceCard
          balance={balance}
          variationPercent={variationPercent}
          onRecharge={() => setShowRechargeModal(true)}
          formatPrice={formatPrice}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Dépensé</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalSpent)}</p>
              <p className="text-sm text-gray-500 mt-1">Depuis l'inscription</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.orderCount}</p>
              <p className="text-sm text-gray-500 mt-1">Commandes complétées</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Panier Moyen</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.averageOrder)}</p>
              <p className="text-sm text-gray-500 mt-1">Par commande</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Chart */}
      <div className="mb-8">
        <BalanceChart
          data={mockBalanceHistory}
          title="Évolution du solde sur 30 jours"
          formatPrice={formatPrice}
        />
      </div>

      {/* Filters */}
      <TransactionFilters
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        transactionTypes={transactionTypes}
      />

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Historique des Transactions</h2>
              <p className="text-sm text-gray-600">
                {filteredTransactions.length} transaction(s) trouvée(s)
              </p>
            </div>
            <ExportButton
              transactions={filteredTransactions}
              filename="tresorerie_client"
              isSupplier={false}
            />
          </div>
        </div>
        <div className="p-6">
          <TransactionList
            transactions={filteredTransactions}
            isSupplier={false}
            formatPrice={formatPrice}
            searchQuery={searchQuery}
          />
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
  );
};

export default TreasuryClient;
