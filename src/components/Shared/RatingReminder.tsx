import React, { useState } from 'react';
import { Star, X, ChevronRight, Bell } from 'lucide-react';
import { PendingOrder } from '../../hooks/usePendingRatings';

interface RatingReminderProps {
  pendingOrders: PendingOrder[];
  onRateOrder: (orderId: string) => void;
}

export const RatingReminder: React.FC<RatingReminderProps> = ({
  pendingOrders,
  onRateOrder
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (pendingOrders.length === 0 || isDismissed) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <>
      {/* Floating Badge */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-full shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
        aria-label={`${pendingOrders.length} évaluation${pendingOrders.length > 1 ? 's' : ''} en attente`}
      >
        <Bell className="h-5 w-5" />
        <span className="font-semibold">
          {pendingOrders.length} évaluation{pendingOrders.length > 1 ? 's' : ''} en attente
        </span>
        <div className="flex items-center justify-center h-6 w-6 bg-white text-orange-600 rounded-full font-bold text-sm">
          {pendingOrders.length}
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Évaluations en attente</h2>
                    <p className="text-orange-100 text-sm">
                      {pendingOrders.length} commande{pendingOrders.length > 1 ? 's' : ''} à évaluer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <p className="text-gray-600 mb-4 text-sm">
                Prenez un moment pour évaluer vos dernières transactions. Vos avis aident à améliorer le service ! 🌟
              </p>

              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-orange-50 transition-colors border border-gray-200 hover:border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            #{order.orderNumber}
                          </span>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            En attente
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.otherPartyName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Livré le {formatDate(order.deliveredAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          onRateOrder(order.orderId);
                        }}
                        className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Star className="h-4 w-4" />
                        <span>Évaluer</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsDismissed(true);
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
