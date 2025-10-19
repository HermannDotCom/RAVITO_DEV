import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Zone {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface ZoneRequest {
  id: string;
  supplier_id: string;
  zone_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  rejection_reason?: string;
  supplier: {
    name: string;
    email: string;
    business_name?: string;
    phone?: string;
  };
  zone: {
    name: string;
    description: string;
  };
}

export const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [requests, setRequests] = useState<ZoneRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: zonesData, error: zonesError } = await supabase
        .from('zones')
        .select('*')
        .order('name');

      if (zonesError) throw zonesError;
      setZones(zonesData || []);

      const { data: requestsData, error: requestsError } = await supabase
        .from('supplier_zones')
        .select(`
          id,
          supplier_id,
          zone_id,
          approval_status,
          requested_at,
          rejection_reason,
          profiles!supplier_zones_supplier_id_fkey (
            name,
            email,
            business_name,
            phone
          ),
          zones (
            name,
            description
          )
        `)
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      const mapped = (requestsData || []).map((req: any) => ({
        id: req.id,
        supplier_id: req.supplier_id,
        zone_id: req.zone_id,
        approval_status: req.approval_status,
        requested_at: req.requested_at,
        rejection_reason: req.rejection_reason,
        supplier: {
          name: req.profiles.name,
          email: req.profiles.email,
          business_name: req.profiles.business_name,
          phone: req.profiles.phone
        },
        zone: req.zones
      }));

      setRequests(mapped);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const requestToApprove = requests.find(r => r.id === requestId);
      if (!requestToApprove) {
        throw new Error('Demande non trouvée');
      }

      const { error } = await supabase
        .from('supplier_zones')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      const { createZoneApprovedNotification } = await import('../../services/notificationService');
      await createZoneApprovedNotification(requestToApprove.supplier_id, requestToApprove.zone.name);

      alert('✅ Demande approuvée avec succès!');
      await loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ Erreur lors de l\'approbation');
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');

    setIsProcessing(true);
    try {
      const requestToReject = requests.find(r => r.id === requestId);
      if (!requestToReject) {
        throw new Error('Demande non trouvée');
      }

      const { error } = await supabase
        .from('supplier_zones')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || 'Non spécifiée'
        })
        .eq('id', requestId);

      if (error) throw error;

      const { createZoneRejectedNotification } = await import('../../services/notificationService');
      await createZoneRejectedNotification(requestToReject.supplier_id, requestToReject.zone.name, reason || undefined);

      alert('✅ Demande rejetée');
      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('❌ Erreur lors du rejet');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const pendingRequests = requests.filter(r => r.approval_status === 'pending');
  const approvedRequests = requests.filter(r => r.approval_status === 'approved');

  const getSuppliersByZone = (zoneId: string) => {
    return approvedRequests.filter(r => r.zone_id === zoneId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Zones de Livraison</h1>
          <p className="text-gray-600">Gérez les zones et validez les demandes d'accès des fournisseurs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Zones Actives</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{zones.filter(z => z.is_active).length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Demandes en Attente</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{pendingRequests.length}</p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Fournisseurs Actifs</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{approvedRequests.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 p-4">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Demandes en attente ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Zones actives ({zones.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'pending' ? (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucune demande en attente</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-10 w-10 bg-orange-200 rounded-full flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.supplier.business_name || request.supplier.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Zone : <span className="font-medium">{request.zone.name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="ml-13 text-sm text-gray-600">
                          <p>Email: {request.supplier.email}</p>
                          {request.supplier.phone && <p>Tél: {request.supplier.phone}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Demandé le {formatDate(request.requested_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => rejectRequest(request.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Rejeter</span>
                        </button>
                        <button
                          onClick={() => approveRequest(request.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approuver</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {zones.map((zone) => {
                  const suppliers = getSuppliersByZone(zone.id);
                  return (
                    <div
                      key={zone.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                            <p className="text-sm text-gray-600">{zone.description}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {suppliers.length} fournisseur{suppliers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {suppliers.length > 0 && (
                        <div className="ml-13 space-y-2">
                          {suppliers.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm text-gray-700">
                                {req.supplier.business_name || req.supplier.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                Approuvé le {formatDate(req.requested_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
