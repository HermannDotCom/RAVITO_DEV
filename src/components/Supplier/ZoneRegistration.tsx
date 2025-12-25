import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Clock, XCircle, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { zoneRequestService, ZoneRegistrationRequest } from '../../services/zoneRequestService';

interface Zone {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface SupplierZone {
  id: string;
  zone_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  rejection_reason?: string;
  zone: Zone;
}

export const ZoneRegistration: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [myZones, setMyZones] = useState<SupplierZone[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ZoneRegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadZones();
    loadMyZones();
    loadPendingRequests();
  }, []);

  const loadZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadMyZones = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_zones')
        .select(`
          id,
          zone_id,
          approval_status,
          requested_at,
          rejection_reason,
          zones (
            id,
            name,
            description,
            is_active
          )
        `)
        .eq('supplier_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(sz => ({
        id: sz.id,
        zone_id: sz.zone_id,
        approval_status: sz.approval_status as 'pending' | 'approved' | 'rejected',
        requested_at: sz.requested_at,
        rejection_reason: sz.rejection_reason,
        zone: (sz as any).zones
      }));

      setMyZones(mapped);
    } catch (error) {
      console.error('Error loading my zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    const requests = await zoneRequestService.getSupplierPendingRequests(user.id);
    setPendingRequests(requests);
  };

  const handleCancelRequest = async (requestId: string) => {
    const confirmed = window.confirm('Voulez-vous vraiment annuler cette demande d\'inscription ?');
    if (!confirmed) return;

    setIsSubmitting(true);
    const success = await zoneRequestService.cancelRequest(requestId);
    if (success) {
      alert('Demande annulée avec succès');
      loadPendingRequests();
    } else {
      alert('Erreur lors de l\'annulation de la demande');
    }
    setIsSubmitting(false);
  };

  const requestZoneAccess = async (zoneId: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('supplier_zones')
        .insert({
          supplier_id: user.id,
          zone_id: zoneId,
          approval_status: 'pending'
        });

      if (error) throw error;

      alert('✅ Demande d\'accès à la zone envoyée avec succès!');
      await loadMyZones();
    } catch (error) {
      console.error('Error requesting zone access:', error);
      alert('❌ Erreur lors de la demande d\'accès');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOldRequest = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('supplier_zones')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      alert('✅ Demande annulée avec succès');
      await loadMyZones();
    } catch (error) {
      console.error('Error canceling old request:', error);
      alert('❌ Erreur lors de l\'annulation de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvée
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  const isZoneRequested = (zoneId: string) => {
    const hasOldRequest = myZones.some(sz => sz.zone_id === zoneId && sz.approval_status !== 'rejected');
    const hasNewRequest = pendingRequests.some(req => req.zone_id === zoneId);
    return hasOldRequest || hasNewRequest;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des zones...</p>
        </div>
      </div>
    );
  }

  const approvedZones = myZones.filter(sz => sz.approval_status === 'approved');
  const pendingZones = myZones.filter(sz => sz.approval_status === 'pending');
  const totalPendingCount = pendingZones.length + pendingRequests.length;
  const availableZones = zones.filter(z => !isZoneRequested(z.id));

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Zones de Livraison</h1>
          <p className="text-gray-600">
            Demandez l'accès aux zones dans lesquelles vous souhaitez livrer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Zones Approuvées</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{approvedZones.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">En Attente</p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">{totalPendingCount}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Zones Disponibles</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{availableZones.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {approvedZones.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mes Zones Approuvées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedZones.map((sz) => (
                <div
                  key={sz.id}
                  className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{sz.zone.name}</h3>
                      <p className="text-sm text-gray-600">{sz.zone.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(sz.approval_status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {(pendingZones.length > 0 || pendingRequests.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <span>Mes Demandes en Attente</span>
            </h2>
            <div className="space-y-3">
              {pendingZones.map((sz) => (
                <div
                  key={sz.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-10 w-10 bg-yellow-200 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{sz.zone.name}</h3>
                      <p className="text-sm text-gray-600">
                        Demandée le {formatDate(sz.requested_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente
                    </span>
                    <button
                      onClick={() => handleCancelOldRequest(sz.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Annuler la demande"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Annuler la demande
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-10 w-10 bg-yellow-200 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.zone_name}</h3>
                      <p className="text-sm text-gray-600">
                        Demandée le {formatDate(request.created_at)}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-500 mt-1 italic">"{request.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente
                    </span>
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Annuler la demande"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Annuler la demande
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableZones.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Zones Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-600">{zone.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => requestZoneAccess(zone.id)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    Demander
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Toutes les zones demandées
            </h3>
            <p className="text-gray-600">
              Vous avez déjà demandé l'accès à toutes les zones disponibles.
            </p>
          </div>
        )}

        {myZones.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center mb-6">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune zone enregistrée</h3>
            <p className="text-gray-600 mb-4">
              Vous devez demander l'accès à au moins une zone pour recevoir des commandes.
            </p>
            <p className="text-sm text-gray-500">
              Sélectionnez les zones dans lesquelles vous souhaitez livrer ci-dessus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
