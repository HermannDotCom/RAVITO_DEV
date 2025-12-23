import React, { useState } from 'react';
import { Truck, RefreshCw, User } from 'lucide-react';
import { useDeliveryMode } from '../../../hooks/useDeliveryMode';
import { DeliveryStats } from './DeliveryStats';
import { DeliveryFilters } from './DeliveryFilters';
import { DeliveryCard } from './DeliveryCard';
import { DeliveryConfirmationModal } from './DeliveryConfirmationModal';
import { DeliveryOrder } from '../../../types/delivery';

/**
 * Main Delivery Mode page for delivery personnel
 * Simplified, mobile-first interface focused on delivery tasks
 */
export const DeliveryModePage: React.FC = () => {
  const {
    deliveries,
    todayStats,
    isLoading,
    error,
    filter,
    setFilter,
    startDelivery,
    markAsArrived,
    confirmDelivery,
    refetch,
  } = useDeliveryMode();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Open navigation (Google Maps / Apple Maps)
   */
  const openNavigation = (delivery: DeliveryOrder) => {
    const { clientLat, clientLng, clientAddress } = delivery;
    
    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (clientLat && clientLng) {
      if (isIOS) {
        window.open(`maps://maps.apple.com/?daddr=${clientLat},${clientLng}`, '_blank');
      } else if (isAndroid) {
        window.open(`google.navigation:q=${clientLat},${clientLng}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${clientLat},${clientLng}`, '_blank');
      }
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientAddress)}`, '_blank');
    }
  };

  /**
   * Call client
   */
  const callClient = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  /**
   * Handle start delivery
   */
  const handleStartDelivery = async (delivery: DeliveryOrder) => {
    try {
      await startDelivery(delivery.id);
    } catch (err) {
      console.error('Error starting delivery:', err);
      alert('Erreur lors du démarrage de la livraison');
    }
  };

  /**
   * Handle mark as arrived
   */
  const handleMarkArrived = async (delivery: DeliveryOrder) => {
    try {
      await markAsArrived(delivery.id);
    } catch (err) {
      console.error('Error marking as arrived:', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  /**
   * Open confirmation modal
   */
  const handleOpenConfirmModal = (delivery: DeliveryOrder) => {
    setSelectedDelivery(delivery);
    setShowConfirmModal(true);
  };

  /**
   * Confirm delivery with code
   */
  const handleConfirmDelivery = async (code: string): Promise<boolean> => {
    if (!selectedDelivery) return false;
    
    try {
      const isValid = await confirmDelivery(selectedDelivery.id, code);
      return isValid;
    } catch (err) {
      console.error('Error confirming delivery:', err);
      return false;
    }
  };

  /**
   * Refresh deliveries
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get counts for filters
  const allDeliveries = deliveries.length;
  const pendingCount = deliveries.filter(d => d.status === 'ready_for_delivery').length;
  const inProgressCount = deliveries.filter(d => d.status === 'out_for_delivery' || d.status === 'arrived').length;
  const completedCount = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-green-500 rounded-xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mode Livreur</h1>
                <p className="text-xs text-gray-600">Vos livraisons du jour</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="h-5 w-5 text-gray-700" />
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <User className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <DeliveryStats 
          stats={todayStats} 
          onFilterSelect={(f) => setFilter(f)} 
        />

        {/* Filters */}
        <DeliveryFilters
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={{
            all: allDeliveries,
            pending: pendingCount,
            inProgress: inProgressCount,
            completed: completedCount,
          }}
        />

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        )}

        {/* Deliveries List */}
        {!isLoading && deliveries.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 bg-gray-100 rounded-full mb-4">
              <Truck className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune livraison
            </h3>
            <p className="text-gray-600">
              {filter === 'all' && "Vous n'avez pas de livraisons pour le moment"}
              {filter === 'pending' && "Aucune livraison à faire"}
              {filter === 'in_progress' && "Aucune livraison en cours"}
              {filter === 'completed' && "Aucune livraison terminée aujourd'hui"}
            </p>
          </div>
        )}

        {!isLoading && deliveries.length > 0 && (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStartDelivery={() => handleStartDelivery(delivery)}
                onMarkArrived={() => handleMarkArrived(delivery)}
                onConfirmDelivery={() => handleOpenConfirmModal(delivery)}
                onNavigate={() => openNavigation(delivery)}
                onCall={() => callClient(delivery.clientPhone)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <DeliveryConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedDelivery(null);
        }}
        onConfirm={handleConfirmDelivery}
        orderNumber={selectedDelivery?.orderNumber || ''}
      />
    </div>
  );
};
