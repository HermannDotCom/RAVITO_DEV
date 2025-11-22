import React, { useState, useEffect } from 'react';
import {
  CreditCard, 
  Users, 
  Package, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  DollarSign,
  AlertTriangle,
  X
} from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { useAuth } from '../../context/AuthContext';
import { SupplierPayment, Transfer } from '../../types';
import { 
  createTransfer, 
  getRecentTransfers,
  completeTransfer 
} from '../../services/transferService';

export const Treasury: React.FC = () => {
  const { allOrders } = useOrder();
  const { commissionSettings } = useCommission();
  const { user } = useAuth();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

  // Load recent transfers from Supabase on mount
  useEffect(() => {
    loadRecentTransfers();
  }, []);

  const loadRecentTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const transfers = await getRecentTransfers(10);
      setRecentTransfers(transfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  // Calculer les commissions dynamiquement depuis les paramètres
  const PLATFORM_COMMISSION = commissionSettings.supplierCommission / 100;
  const PAYMENT_PROCESSING_FEE = commissionSettings.clientCommission / 100;
  const TOTAL_COMMISSION = PLATFORM_COMMISSION + PAYMENT_PROCESSING_FEE;

  // Filtrer les commandes livrées et payées mais non transférées
  const ordersToTransfer = allOrders.filter(order => 
    order.status === 'delivered' && 
    (!order.paymentStatus || order.paymentStatus === 'paid') &&
    order.supplierId
  );

  const getSupplierName = (supplierId: string): string => {
    const suppliers = {
      'supplier-1': 'Dépôt du Plateau',
      'supplier-2': 'Dépôt Cocody Express',
      'supplier-3': 'Dépôt Marcory Sud'
    };
    return suppliers[supplierId as keyof typeof suppliers] || `Fournisseur ${supplierId}`;
  };

  // Grouper par fournisseur
  const supplierPayments: SupplierPayment[] = ordersToTransfer.reduce((acc, order) => {
    if (!order.supplierId) return acc;

    const existingSupplier = acc.find(s => s.supplierId === order.supplierId);
    const netAmount = order.totalAmount * (1 - TOTAL_COMMISSION);

    if (existingSupplier) {
      existingSupplier.totalAmount += netAmount;
      existingSupplier.orderCount += 1;
      existingSupplier.orders.push(order);
      if (order.deliveredAt && order.deliveredAt > existingSupplier.lastOrderDate) {
        existingSupplier.lastOrderDate = order.deliveredAt;
      }
    } else {
      acc.push({
        supplierId: order.supplierId,
        supplierName: getSupplierName(order.supplierId),
        totalAmount: netAmount,
        orderCount: 1,
        orders: [order],
        lastOrderDate: order.deliveredAt || order.createdAt
      });
    }

    return acc;
  }, [] as SupplierPayment[]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransferStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'pending': 'En attente',
      'approved': 'Approuvé',
      'completed': 'Transféré',
      'rejected': 'Rejeté'
    };
    return statusLabels[status] || status;
  };

  const handleProcessPayment = async (supplier: SupplierPayment) => {
    if (!user) {
      alert('❌ Erreur: Utilisateur non connecté');
      return;
    }

    setProcessingPayment(supplier.supplierId);
    
    try {
      // Create transfer record in database
      const orderIds = supplier.orders.map(order => order.id);
      
      const result = await createTransfer(
        {
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          amount: supplier.totalAmount,
          orderIds: orderIds,
          transferMethod: 'bank_transfer',
          notes: `Transfer for ${supplier.orderCount} order(s)`,
          metadata: {
            orderCount: supplier.orderCount,
            processedBy: user.id,
            processedAt: new Date().toISOString()
          }
        },
        user.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create transfer');
      }

      // Complete the transfer immediately (in production, this would be a separate approval step)
      if (result.transferId) {
        const completeResult = await completeTransfer(result.transferId, user.id);
        
        if (!completeResult.success) {
          throw new Error(completeResult.error || 'Failed to complete transfer');
        }
      }

      // Reload transfers to show the new one
      await loadRecentTransfers();
      
      setProcessingPayment(null);
      setShowDetailsModal(false);
      setSelectedSupplier(null);
      
      // Success notification
      alert(`✅ Virement effectué avec succès!\n\n${supplier.supplierName}\nMontant: ${formatPrice(supplier.totalAmount)}\n${supplier.orderCount} commande(s) réglée(s)\n\n📧 Le fournisseur a reçu une notification de virement par SMS et email.\n💰 Le montant sera disponible dans son compte sous 24h.`);
    } catch (error) {
      console.error('Error processing payment:', error);
      setProcessingPayment(null);
      alert(`❌ Erreur lors du virement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShowDetails = (supplier: SupplierPayment) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  // Statistiques globales
  const totalPendingAmount = supplierPayments.reduce((sum, supplier) => sum + supplier.totalAmount, 0);
  const totalPendingOrders = supplierPayments.reduce((sum, supplier) => sum + supplier.orderCount, 0);
  const totalCommissionEarned = ordersToTransfer.reduce((sum, order) => sum + (order.totalAmount * TOTAL_COMMISSION), 0);

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trésorerie</h1>
          <p className="text-gray-600">Gestion des reversements aux fournisseurs</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Fournisseurs à régler</p>
                <p className="text-2xl font-bold text-orange-600">{supplierPayments.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Commandes en attente</p>
                <p className="text-2xl font-bold text-blue-600">{totalPendingOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Montant à reverser</p>
                <p className="text-xl font-bold text-red-600">{formatPrice(totalPendingAmount)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Commissions perçues</p>
                <p className="text-xl font-bold text-green-600">{formatPrice(totalCommissionEarned)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Structure des commissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{(PLATFORM_COMMISSION * 100).toFixed(0)}%</div>
              <div className="text-blue-800">Commission plateforme</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{(PAYMENT_PROCESSING_FEE * 100).toFixed(0)}%</div>
              <div className="text-orange-800">Frais de traitement</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{((1 - TOTAL_COMMISSION) * 100).toFixed(0)}%</div>
              <div className="text-green-800">Reversé au fournisseur</div>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Fournisseurs à régler</h3>
            <p className="text-sm text-gray-600 mt-1">
              Cliquez sur un fournisseur pour voir le détail et effectuer le virement
            </p>
          </div>

          {supplierPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Tous les paiements sont à jour</h3>
              <p className="text-gray-500">Aucun reversement en attente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {supplierPayments.map((supplier) => (
                <div 
                  key={supplier.supplierId} 
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleShowDetails(supplier)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {supplier.supplierName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{supplier.supplierName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{supplier.orderCount} commande(s)</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Dernière: {formatDate(supplier.lastOrderDate)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(supplier.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-500">Montant net à reverser</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transfers */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Virements récents</h3>
          {isLoadingTransfers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des virements...</p>
            </div>
          ) : recentTransfers.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun virement récent</p>
              <p className="text-gray-400 text-sm">Les virements effectués apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{transfer.supplierName}</p>
                      <p className="text-sm text-gray-600">
                        {transfer.orderCount} commande(s) • {formatDate(transfer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatPrice(transfer.amount)}</p>
                    <p className="text-xs text-green-500 capitalize">{getTransferStatusLabel(transfer.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Details Modal */}
      {showDetailsModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedSupplier.supplierName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSupplier.supplierName}</h2>
                    <p className="text-gray-600">
                      {selectedSupplier.orderCount} commande(s) à régler • 
                      Montant net: {formatPrice(selectedSupplier.totalAmount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>


              {/* Orders List */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Détail des commandes</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-4">
                    {selectedSupplier.orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-gray-900">#{order.id}</span>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Livrée
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatDate(order.deliveredAt || order.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium text-gray-900 ml-2">Maquis Belle Vue</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Articles:</span>
                            <span className="font-medium text-gray-900 ml-2">{order.items.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Montant TTC:</span>
                            <span className="font-medium text-gray-900 ml-2">{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Net fournisseur:</span>
                            <span className="font-bold text-green-600 ml-2">
                              {formatPrice(order.totalAmount * (1 - TOTAL_COMMISSION))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Action */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-900 mb-2">Confirmation de virement</h4>
                    <p className="text-yellow-800 text-sm mb-4">
                      Vous allez effectuer un virement de <strong>{formatPrice(selectedSupplier.totalAmount)}</strong> 
                      à <strong>{selectedSupplier.supplierName}</strong> pour {selectedSupplier.orderCount} commande(s).
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      <li>Le statut de toutes les commandes passera à "Paiement reversé"</li>
                      <li>Le fournisseur recevra une notification de virement</li>
                      <li>Cette action est irréversible</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleProcessPayment(selectedSupplier)}
                  disabled={!!processingPayment}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {processingPayment === selectedSupplier.supplierId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Paiement en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Régler {formatPrice(selectedSupplier.totalAmount)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};