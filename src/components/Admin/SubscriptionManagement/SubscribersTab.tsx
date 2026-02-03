import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import type { SubscriptionWithDetails, SubscriptionStatus } from '../../../types/subscription';
import {
  formatCurrency,
  getSubscriptionStatusName,
  getSubscriptionStatusColor
} from '../../../types/subscription';
import {
  getAllSubscriptions,
  adminSuspendSubscription,
  adminReactivateSubscription
} from '../../../services/admin/subscriptionAdminService';
import { useToast } from '../../../context/ToastContext';

export const SubscribersTab: React.FC = () => {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, statusFilter, searchQuery]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      showToast('Erreur lors du chargement des abonnés', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.organizationName.toLowerCase().includes(query) ||
        s.plan.name.toLowerCase().includes(query)
      );
    }

    setFilteredSubscriptions(filtered);
  };

  const handleSuspend = async (subscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir suspendre cet abonnement ?')) return;

    try {
      setActionLoading(subscriptionId);
      await adminSuspendSubscription(subscriptionId, 'Suspendu manuellement par l\'admin');
      showToast('Abonnement suspendu', 'success');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error suspending subscription:', error);
      showToast('Erreur lors de la suspension', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (subscriptionId: string) => {
    try {
      setActionLoading(subscriptionId);
      await adminReactivateSubscription(subscriptionId);
      showToast('Abonnement réactivé', 'success');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      showToast('Erreur lors de la réactivation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case 'trial':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_payment':
        return <AlertCircle className="w-4 h-4" />;
      case 'suspended':
        return <Ban className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: SubscriptionStatus) => {
    const color = getSubscriptionStatusColor(status);
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: subscriptions.length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pending: subscriptions.filter(s => s.status === 'pending_payment').length,
    suspended: subscriptions.filter(s => s.status === 'suspended').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des abonnés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-900">{stats.trial}</div>
          <div className="text-sm text-blue-700">Essai gratuit</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-900">{stats.active}</div>
          <div className="text-sm text-green-700">Actifs</div>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="text-2xl font-bold text-orange-900">{stats.pending}</div>
          <div className="text-sm text-orange-700">En attente</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-900">{stats.suspended}</div>
          <div className="text-sm text-red-700">Suspendus</div>
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
            placeholder="Rechercher par organisation ou plan..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="trial">Essai gratuit</option>
            <option value="active">Actif</option>
            <option value="pending_payment">En attente</option>
            <option value="suspended">Suspendu</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
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
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Montant dû
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun abonné trouvé
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {subscription.organizationName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.plan.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(subscription.plan.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        <span className="ml-1">{getSubscriptionStatusName(subscription.status)}</span>
                      </span>
                      {subscription.daysLeftInTrial !== null && subscription.status === 'trial' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {subscription.daysLeftInTrial} jour(s) restant(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subscription.amountDue > 0 ? (
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(subscription.amountDue)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(subscription.subscribedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {subscription.status === 'suspended' ? (
                        <button
                          onClick={() => handleReactivate(subscription.id)}
                          disabled={actionLoading === subscription.id}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          Réactiver
                        </button>
                      ) : subscription.status === 'active' || subscription.status === 'trial' ? (
                        <button
                          onClick={() => handleSuspend(subscription.id)}
                          disabled={actionLoading === subscription.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Suspendre
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
