import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Package, Users, TrendingUp, AlertTriangle, Edit, Trash2, Bell, UserPlus, X, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ZoneDetailsModal } from './ZoneManagement/ZoneDetailsModal';
import { zoneRequestService, ZoneRegistrationRequest } from '../../services/zoneRequestService';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  max_suppliers?: number;
  min_coverage?: number;
  operating_hours?: string;
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
  const [pendingRequestsMap, setPendingRequestsMap] = useState<Map<string, number>>(new Map());
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedZoneRequests, setSelectedZoneRequests] = useState<ZoneRegistrationRequest[]>([]);
  const [selectedZoneForRequests, setSelectedZoneForRequests] = useState<Zone | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadZones();
    loadPendingRequests();
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

  const loadPendingRequests = async () => {
    const zonesWithRequests = await zoneRequestService.getZonesWithPendingRequests();
    const requestsMap = new Map<string, number>();
    zonesWithRequests.forEach(zone => {
      requestsMap.set(zone.zone_id, zone.pending_requests_count);
    });
    setPendingRequestsMap(requestsMap);
  };

  const handleViewRequests = async (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    const requests = await zoneRequestService.getPendingRequestsForZone(zone.id);
    setSelectedZoneForRequests(zone);
    setSelectedZoneRequests(requests);
    setShowRequestsModal(true);
  };

  const handleApproveRequest = async (requestId: string) => {
    setIsProcessing(true);
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (!adminId) return;

    const success = await zoneRequestService.approveRequest(requestId, adminId);
    if (success) {
      alert('Demande approuvée avec succès');
      if (selectedZoneForRequests) {
        const requests = await zoneRequestService.getPendingRequestsForZone(selectedZoneForRequests.id);
        setSelectedZoneRequests(requests);
      }
      loadPendingRequests();
    } else {
      alert('Erreur lors de l\'approbation de la demande');
    }
    setIsProcessing(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Raison du refus (optionnel):');
    setIsProcessing(true);
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (!adminId) return;

    const success = await zoneRequestService.rejectRequest(requestId, adminId, reason || undefined);
    if (success) {
      alert('Demande refusée');
      if (selectedZoneForRequests) {
        const requests = await zoneRequestService.getPendingRequestsForZone(selectedZoneForRequests.id);
        setSelectedZoneRequests(requests);
      }
      loadPendingRequests();
    } else {
      alert('Erreur lors du refus de la demande');
    }
    setIsProcessing(false);
  };

  const deleteZone = async (zoneId: string, zoneName: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la zone "${zoneName}" ?\n\n` +
      `Cette action est irréversible et supprimera également :\n` +
      `- Toutes les inscriptions de fournisseurs dans cette zone\n` +
      `- L'historique des commandes liées à cette zone`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      alert('Zone supprimée avec succès');
      loadZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Erreur lors de la suppression de la zone');
    }
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

                const pendingCount = pendingRequestsMap.get(zone.id) || 0;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700
                      hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all group relative"
                  >
                    {pendingCount > 0 && (
                      <button
                        onClick={(e) => handleViewRequests(zone, e)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center animate-pulse transition-colors z-10"
                        title="Voir les demandes"
                      >
                        <span className="text-white text-xs font-bold">{pendingCount}</span>
                      </button>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {zone.name}
                        </h3>
                        {pendingCount > 0 && (
                          <button
                            onClick={(e) => handleViewRequests(zone, e)}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 flex items-center space-x-1 transition-colors"
                            title="Voir les demandes"
                          >
                            <Bell className="h-3 w-3" />
                            <span>{pendingCount}</span>
                          </button>
                        )}
                      </div>
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
                          {stats.suppliers_count}/{zone.max_suppliers || 10}
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

                    <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {pendingCount > 0 && (
                        <button
                          onClick={(e) => handleViewRequests(zone, e)}
                          className="w-full px-3 py-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50
                            text-orange-700 dark:text-orange-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Voir les demandes ({pendingCount})
                        </button>
                      )}
                      <div className="flex items-center gap-2">
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
                            deleteZone(zone.id, zone.name);
                          }}
                          className="flex-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50
                            text-red-700 dark:text-red-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      </div>
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
        <ZoneDetailsModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          onUpdate={loadZones}
        />
      )}

      {showCreateModal && (
        <CreateZoneModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadZones}
        />
      )}

      {showRequestsModal && selectedZoneForRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Demandes d'inscription - {selectedZoneForRequests.name}
                </h2>
                <button
                  onClick={() => {
                    setShowRequestsModal(false);
                    setSelectedZoneForRequests(null);
                    setSelectedZoneRequests([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedZoneRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune demande en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedZoneRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {request.supplier_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.supplier_email}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          En attente
                        </span>
                      </div>

                      {request.message && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{request.message}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateZoneModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateZoneModal: React.FC<CreateZoneModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    maxSuppliers: 5,
    minCoverage: 2,
    operatingHours: '18h00 - 06h00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createZone = async () => {
    if (!formData.name.trim()) {
      alert('Le nom de la commune est requis');
      return;
    }

    if (formData.maxSuppliers < 1) {
      alert('Le nombre maximum de fournisseurs doit être supérieur à 0');
      return;
    }

    if (formData.minCoverage < 1) {
      alert('La couverture minimum doit être supérieure à 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('zones')
        .insert({
          name: formData.name,
          description: null,
          max_suppliers: formData.maxSuppliers,
          min_coverage: formData.minCoverage,
          operating_hours: formData.operatingHours,
          is_active: true
        });

      if (error) throw error;

      alert('Zone créée avec succès');
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Erreur lors de la création de la zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Nouvelle zone de livraison
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Créez une nouvelle zone de livraison
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de la commune *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Plateau, Cocody, Marcory..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fournisseurs maximum
              </label>
              <input
                type="number"
                value={formData.maxSuppliers}
                onChange={(e) => setFormData({ ...formData, maxSuppliers: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couverture minimum
              </label>
              <input
                type="number"
                value={formData.minCoverage}
                onChange={(e) => setFormData({ ...formData, minCoverage: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horaires d'activité
            </label>
            <input
              type="text"
              value={formData.operatingHours}
              onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
              placeholder="18h00 - 06h00"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={createZone}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium
                transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Création...' : 'Créer la zone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
