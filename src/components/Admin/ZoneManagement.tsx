import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Package, Users, TrendingUp, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface ZoneStats {
  suppliers_count: number;
  active_suppliers_count: number;
  orders_count: number;
  avg_delivery_time: number;
  success_rate: number;
}

export const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [zoneStats, setZoneStats] = useState<Map<string, ZoneStats>>(new Map());

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const { data: zonesData, error } = await supabase
        .from('zones')
        .select('*')
        .order('name');

      if (error) throw error;

      setZones(zonesData || []);

      if (zonesData) {
        await loadZoneStats(zonesData);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadZoneStats = async (zones: Zone[]) => {
    const statsMap = new Map<string, ZoneStats>();

    for (const zone of zones) {
      const { data: suppliers, error: suppliersError } = await supabase
        .from('supplier_zones')
        .select('id, is_active, approval_status')
        .eq('zone_id', zone.id);

      if (suppliersError) {
        console.error('Error loading supplier stats:', suppliersError);
        continue;
      }

      const totalSuppliers = suppliers?.length || 0;
      const activeSuppliers = suppliers?.filter(s => s.is_active && s.approval_status === 'approved').length || 0;

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('zone_id', zone.id);

      statsMap.set(zone.id, {
        suppliers_count: totalSuppliers,
        active_suppliers_count: activeSuppliers,
        orders_count: ordersCount || 0,
        avg_delivery_time: 0,
        success_rate: 100
      });
    }

    setZoneStats(statsMap);
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (zone.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && zone.is_active) ||
                         (filterStatus === 'inactive' && !zone.is_active);

    return matchesSearch && matchesFilter;
  });

  const activeZonesCount = zones.filter(z => z.is_active).length;
  const inactiveZonesCount = zones.filter(z => !z.is_active).length;
  const totalActiveSuppliers = Array.from(zoneStats.values()).reduce((sum, s) => sum + s.active_suppliers_count, 0);
  const totalInactiveSuppliers = Array.from(zoneStats.values()).reduce((sum, s) => sum + (s.suppliers_count - s.active_suppliers_count), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gestion des Zones de Livraison
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administrez les zones par commune et gérez les fournisseurs inscrits
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Nouvelle zone
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Zones actives</p>
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeZonesCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Zones inactives</p>
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{inactiveZonesCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fournisseurs actifs</p>
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalActiveSuppliers}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fournisseurs inactifs</p>
              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalInactiveSuppliers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une zone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                  focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Toutes les zones</option>
                <option value="active">Actives uniquement</option>
                <option value="inactive">Inactives uniquement</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Vue d'ensemble des zones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredZones.map((zone) => {
                const stats = zoneStats.get(zone.id) || {
                  suppliers_count: 0,
                  active_suppliers_count: 0,
                  orders_count: 0,
                  avg_delivery_time: 0,
                  success_rate: 100
                };

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700
                      hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {zone.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        zone.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fournisseurs:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stats.active_suppliers_count}/{stats.suppliers_count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Commandes:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.orders_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Performance:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{stats.success_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Temps moyen:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.avg_delivery_time} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedZone(zone);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                          text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50
                          text-red-700 dark:text-red-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredZones.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune zone trouvée</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedZone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Zone {selectedZone.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedZone.description}</p>
            <button
              onClick={() => setSelectedZone(null)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
