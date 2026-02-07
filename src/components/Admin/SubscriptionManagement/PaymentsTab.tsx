import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Loader2, X, Sparkles } from 'lucide-react';
import {
  getPendingPaymentClaims,
  validatePaymentClaim,
  rejectPaymentClaim
} from '../../../services/admin/subscriptionAdminService';
import type { PendingPaymentClaim } from '../../../services/admin/subscriptionAdminService';
import { formatCurrency, getPaymentMethodName } from '../../../types/subscription';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export const PaymentsTab: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [claims, setClaims] = useState<PendingPaymentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingClaim, setRejectingClaim] = useState<PendingPaymentClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const knownIdsRef = useRef<Set<string>>(new Set());

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingPaymentClaims();

      const newIds = new Set<string>();
      data.forEach(claim => {
        if (!knownIdsRef.current.has(claim.id)) {
          newIds.add(claim.id);
        }
      });

      knownIdsRef.current = new Set(data.map(c => c.id));

      if (newIds.size > 0) {
        setRecentIds(newIds);
        setTimeout(() => setRecentIds(new Set()), 10000);
      }

      setClaims(data);
    } catch (error) {
      console.error('Error loading payment claims:', error);
      showToast({ type: 'error', message: 'Erreur lors du chargement des paiements' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClaims();

    const channel = supabase
      .channel('payments-tab-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_payments'
        },
        () => {
          loadClaims();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadClaims]);

  const handleValidate = async (claim: PendingPaymentClaim) => {
    if (!user?.id) return;

    try {
      setProcessingId(claim.id);
      await validatePaymentClaim(claim.id, user.id);
      showToast({ type: 'success', message: 'Paiement valide avec succes' });
      await loadClaims();
    } catch (error) {
      console.error('Error validating claim:', error);
      showToast({ type: 'error', message: 'Erreur lors de la validation' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (claim: PendingPaymentClaim) => {
    setRejectingClaim(claim);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectingClaim || !rejectionReason.trim()) return;

    try {
      setProcessingId(rejectingClaim.id);
      await rejectPaymentClaim(rejectingClaim.id, rejectionReason.trim());
      showToast({ type: 'success', message: 'Paiement rejete' });
      setShowRejectModal(false);
      setRejectingClaim(null);
      await loadClaims();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      showToast({ type: 'error', message: 'Erreur lors du rejet' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            <span>{claims.length} en attente</span>
          </div>
        </div>
        <button
          onClick={loadClaims}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Rafraichir</span>
        </button>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">✅ Aucun paiement en attente de validation</h3>
          <p className="text-sm text-gray-500">Tous les paiements ont été traités.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isProcessing = processingId === claim.id;
            const isRecent = recentIds.has(claim.id);

            return (
              <div
                key={claim.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-500 ${
                  isRecent
                    ? 'border-green-400 ring-2 ring-green-200 animate-pulse'
                    : 'border-gray-200'
                }`}
              >
                {isRecent && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">Nouveau paiement declare</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isRecent ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${isRecent ? 'text-green-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{claim.organizationName}</h4>
                          <p className="text-sm text-gray-500">Facture {claim.invoiceNumber}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Montant</p>
                          <p className="font-bold text-gray-900">{formatCurrency(claim.amount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Moyen de paiement</p>
                          <p className="font-semibold text-gray-900">{getPaymentMethodName(claim.paymentMethod)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Reference</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 break-all">
                            {claim.transactionReference || '-'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Date de soumission</p>
                          <p className="font-semibold text-gray-900">
                            {claim.createdAt.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 md:min-w-[140px]">
                      <button
                        onClick={() => handleValidate(claim)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Valider</span>
                      </button>
                      <button
                        onClick={() => openRejectModal(claim)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showRejectModal && rejectingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Rejeter le paiement</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingClaim(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Organisation:</div>
                <div className="font-semibold">{rejectingClaim.organizationName}</div>
                <div className="text-gray-600">Facture:</div>
                <div className="font-semibold">{rejectingClaim.invoiceNumber}</div>
                <div className="text-gray-600">Montant:</div>
                <div className="font-semibold">{formatCurrency(rejectingClaim.amount)}</div>
                <div className="text-gray-600">Reference:</div>
                <div className="font-mono text-sm">{rejectingClaim.transactionReference || '-'}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ex: Reference de transaction introuvable, montant incorrect..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce motif sera communique au client par notification.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingClaim(null);
                }}
                disabled={processingId !== null}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId !== null}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {processingId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Rejeter le paiement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
