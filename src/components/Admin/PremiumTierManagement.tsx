import React, { useState, useEffect } from 'react';
import { Crown, DollarSign, Users, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { 
  getAllSubscriptions, 
  getSubscriptionStats, 
  activateSubscription,
  cancelSubscription
} from '../../services/premiumTierService';

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  byTier: { [key: string]: number };
}

export const PremiumTierManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, statsData] = await Promise.all([
        getAllSubscriptions(),
        getSubscriptionStats()
      ]);
      setSubscriptions(subsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (subscriptionId: string) => {
    if (!confirm('Confirmer l\'activation de cet abonnement ?')) return;
    
    setProcessing(subscriptionId);
    try {
      const result = await activateSubscription(subscriptionId);
      if (result.success) {
        alert('Abonnement activé avec succès!');
        await loadData();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    if (reason === null) return; // User clicked cancel
    
    setProcessing(subscriptionId);
    try {
      const result = await cancelSubscription(subscriptionId, reason);
      if (result.success) {
        alert('Abonnement annulé avec succès!');
        await loadData();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Erreur lors de l\'annulation');
    } finally {
      setProcessing(null);
    }
  };

  interface SubscriptionWithSupplier extends Record<string, unknown> {
    supplier?: { name?: string; business_name?: string; email?: string };
    tier?: { name?: string; display_name?: string };
    status?: string;
  }

  const filteredSubscriptions = subscriptions.filter((sub: SubscriptionWithSupplier) => {
    const supplierName = sub.supplier?.name || '';
    const businessName = sub.supplier?.business_name || '';
    const email = sub.supplier?.email || '';
    
    const matchesSearch = searchTerm === '' || 
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Abonnements Premium</h1>
          <p className="text-gray-600 mt-1">Gérez les tiers d'abonnement et la facturation</p>
        </div>
        <div className="h-16 w-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
          <Crown className="h-8 w-8 text-yellow-900" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm">Total Abonnements</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalSubscriptions || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-sm">Abonnements Actifs</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-sm">MRR (Revenu Mensuel)</p>
          <p className="text-3xl font-bold text-gray-900">
            {(stats?.monthlyRecurringRevenue || 0).toLocaleString()} <span className="text-lg">FCFA</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Crown className="h-8 w-8 text-yellow-700" />
          </div>
          <p className="text-gray-700 text-sm font-semibold">Abonnés Gold</p>
          <p className="text-3xl font-bold text-yellow-900">{stats?.byTier?.gold || 0}</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Distribution par Tier</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{stats?.byTier?.basic || 0}</div>
            <div className="text-sm text-blue-700 font-medium">Basic (Gratuit)</div>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats?.byTier?.silver || 0}</div>
            <div className="text-sm text-gray-700 font-medium">Silver (5k/mois)</div>
          </div>
          <div className="text-center p-4 bg-yellow-100 rounded-lg">
            <div className="text-2xl font-bold text-yellow-900">{stats?.byTier?.gold || 0}</div>
            <div className="text-sm text-yellow-700 font-medium">Gold (15k/mois)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="cancelled">Annulé</option>
                <option value="expired">Expiré</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prochain paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total payé
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((sub: SubscriptionWithSupplier) => {
                const supplierName = sub.supplier?.business_name || sub.supplier?.name || 'N/A';
                const supplierEmail = sub.supplier?.email || '';
                const tierName = sub.tier?.name as string || 'basic';
                const tierDisplayName = sub.tier?.display_name || 'N/A';
                const totalPaid = typeof sub.total_paid === 'number' ? sub.total_paid : 0;
                
                return (
                <tr key={sub.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {supplierName}
                      </div>
                      <div className="text-sm text-gray-500">{supplierEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      tierName === 'gold' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : tierName === 'silver'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tierName === 'gold' && <Crown className="h-3 w-3 mr-1" />}
                      {tierDisplayName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : sub.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : sub.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {sub.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {sub.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub.starts_at ? new Date(sub.starts_at as string).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub.next_payment_date 
                      ? new Date(sub.next_payment_date as string).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totalPaid.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {sub.status === 'pending' && (
                      <button
                        onClick={() => handleActivate(sub.id as string)}
                        disabled={processing === (sub.id as string)}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        Activer
                      </button>
                    )}
                    {sub.status === 'active' && tierName !== 'basic' && (
                      <button
                        onClick={() => handleCancel(sub.id as string)}
                        disabled={processing === (sub.id as string)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        
        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun abonnement trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};
