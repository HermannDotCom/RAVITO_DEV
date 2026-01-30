import React, { useState } from 'react';
import { Search, Building2, Store } from 'lucide-react';
import type { RegisteredClient, SalesCommissionSettings } from '../../../types/sales';
import { formatCurrency } from '../../../types/sales';

interface RegisteredClientsTabProps {
  clients: RegisteredClient[];
  settings: SalesCommissionSettings | null;
  isLoading: boolean;
}

export const RegisteredClientsTab: React.FC<RegisteredClientsTabProps> = ({
  clients,
  settings,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'supplier'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activated' | 'pending'>('all');

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des inscrits...</p>
        </div>
      </div>
    );
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!client.name.toLowerCase().includes(query) && 
          !client.address.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (filterType !== 'all' && client.role !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus === 'activated' && !client.isActivated) {
      return false;
    }
    if (filterStatus === 'pending' && client.isActivated) {
      return false;
    }

    return true;
  });

  const activatedCount = clients.filter(c => c.isActivated).length;
  const pendingCount = clients.length - activatedCount;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">📋 MES INSCRITS</h2>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom ou adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tous types</option>
              <option value="client">CHR</option>
              <option value="supplier">Dépôts</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tous statuts</option>
              <option value="activated">Activés</option>
              <option value="pending">En cours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{activatedCount}</div>
          <div className="text-sm text-gray-600">Activés</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          <div className="text-sm text-gray-600">En cours</div>
        </div>
      </div>

      {/* Clients list */}
      {filteredClients.length > 0 ? (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const Icon = client.role === 'client' ? Store : Building2;
            const remaining = client.role === 'client'
              ? settings.chrActivationThreshold - client.totalCa
              : settings.depotActivationDeliveries - client.totalDeliveries;

            return (
              <div
                key={client.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${
                    client.role === 'client' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      client.role === 'client' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-600">
                          📍 {client.address}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 Inscrit le {formatDate(client.registeredAt)}
                        </p>
                      </div>
                      <div>
                        {client.isActivated ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✅ ACTIVÉ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            🟡 EN COURS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm">
                      {client.role === 'client' ? (
                        <>
                          <span className="text-gray-700">
                            💰 CA: <span className="font-semibold">{formatCurrency(client.totalCa)}</span>
                          </span>
                          {!client.isActivated && (
                            <span className="text-orange-600">
                              ({formatCurrency(remaining)} restants)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-gray-700">
                            📦 Livraisons: <span className="font-semibold">{client.totalDeliveries}</span>
                          </span>
                          {!client.isActivated && (
                            <span className="text-orange-600">
                              ({remaining} restante{remaining > 1 ? 's' : ''})
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Progress bar for pending */}
                    {!client.isActivated && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progression</span>
                          <span className="text-xs font-medium text-gray-900">
                            {client.activationProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, client.activationProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Aucun client ne correspond à tes critères de recherche.'
              : 'Tu n\'as pas encore inscrit de clients.'}
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Critères d'activation</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <span className="font-semibold">CHR:</span> CA cumulé ≥ {formatCurrency(settings.chrActivationThreshold)}
          </p>
          <p>
            <span className="font-semibold">Dépôt:</span> {settings.depotActivationDeliveries} livraisons effectuées
          </p>
        </div>
      </div>
    </div>
  );
};
