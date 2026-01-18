import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Users,
  Package,
  CheckCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { useAuth } from '../../context/AuthContext';
import { SupplierPayment, Transfer } from '../../types';
import {
  createTransfer,
  getRecentTransfers,
  getTransferById,
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
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedTransferDetails, setSelectedTransferDetails] = useState<{
    transfer: Transfer;
    orders: Array<{ id: string; clientName: string; articles: number; totalAmount: number; netAmount: number; deliveredAt: Date }>;
  } | null>(null);

  useEffect(() => {
    loadRecentTransfers();
  }, []);

  const loadRecentTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const transfers = await getRecentTransfers(50);
      setRecentTransfers(transfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const PLATFORM_COMMISSION = commissionSettings.supplierCommission / 100;

  // State to hold supplier profiles
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, { name: string; business_name?: string }>>({});
  // State to hold client profiles
  const [clientProfiles, setClientProfiles] = useState<Record<string, { name: string; business_name?: string }>>({});

  // Load supplier profiles
  useEffect(() => {
    const loadSupplierProfiles = async () => {
      const supplierIds = Array.from(new Set(allOrders
        .filter(o => o.supplierId)
        .map(o => o.supplierId!)));

      if (supplierIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', supplierIds);

      if (error) {
        console.error('Error loading supplier profiles:', error);
        return;
      }

      const profilesMap: Record<string, { name: string; business_name?: string }> = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = {
          name: profile.name,
          business_name: profile.business_name
        };
      });
      setSupplierProfiles(profilesMap);
    };

    loadSupplierProfiles();
  }, [allOrders]);

  // Load client profiles
  useEffect(() => {
    const loadClientProfiles = async () => {
      const clientIds = Array.from(new Set(allOrders
        .filter(o => o.clientId)
        .map(o => o.clientId)));

      if (clientIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', clientIds);

      if (error) {
        console.error('Error loading client profiles:', error);
        return;
      }

      const profilesMap: Record<string, { name: string; business_name?: string }> = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = {
          name: profile.name,
          business_name: profile.business_name
        };
      });
      setClientProfiles(profilesMap);
    };

    loadClientProfiles();
  }, [allOrders]);

  // Filtrer les commandes livrées et payées mais non transférées
  const ordersToTransfer = allOrders.filter(order =>
    order.status === 'delivered' &&
    order.supplierId &&
    !order.transferredAt
  );

  const getSupplierName = (supplierId: string): string => {
    const profile = supplierProfiles[supplierId];
    return profile?.business_name || profile?.name || `Fournisseur ${supplierId.substring(0, 8)}`;
  };

  const getClientName = (clientId: string): string => {
    const profile = clientProfiles[clientId];
    return profile?.business_name || profile?.name || 'Client';
  };

  const supplierPayments: SupplierPayment[] = useMemo(() => {
    const uniqueOrdersMap = new Map<string, typeof ordersToTransfer[0]>();
    ordersToTransfer.forEach(order => {
      if (!uniqueOrdersMap.has(order.id)) {
        uniqueOrdersMap.set(order.id, order);
      }
    });
    const uniqueOrders = Array.from(uniqueOrdersMap.values());

    return uniqueOrders.reduce((acc, order) => {
      if (!order.supplierId) return acc;

      const existingSupplier = acc.find(s => s.supplierId === order.supplierId);
      const netAmount = (order.baseAmount || order.totalAmount) * (1 - PLATFORM_COMMISSION);

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
  }, [ordersToTransfer, PLATFORM_COMMISSION, supplierProfiles]);

  const filteredSupplierPayments = useMemo(() => {
    if (!supplierSearchQuery) return supplierPayments;
    const query = supplierSearchQuery.toLowerCase();
    return supplierPayments.filter(s =>
      s.supplierName.toLowerCase().includes(query)
    );
  }, [supplierPayments, supplierSearchQuery]);

  const filteredTransfers = useMemo(() => {
    if (!transferSearchQuery) return recentTransfers;
    const query = transferSearchQuery.toLowerCase();
    return recentTransfers.filter(t =>
      t.supplierName.toLowerCase().includes(query)
    );
  }, [recentTransfers, transferSearchQuery]);

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

      // TODO: In production, implement multi-step approval workflow:
      // 1. Create transfer with status 'pending'
      // 2. Require admin approval (approveTransfer)
      // 3. Then complete transfer (completeTransfer)
      // For MVP, we auto-complete immediately for demonstration purposes
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

  const totalPendingAmount = supplierPayments.reduce((sum, supplier) => sum + supplier.totalAmount, 0);
  const totalPendingOrders = supplierPayments.reduce((sum, supplier) => sum + supplier.orderCount, 0);
  const totalTransfersCompleted = recentTransfers.filter(t => t.status === 'completed').length;

  const handleViewTransferDetails = async (transfer: Transfer) => {
    try {
      const { orders: transferOrders } = await getTransferById(transfer.id);

      const orderIds = transferOrders.map(to => to.orderId);
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, client_id, base_amount, total_amount, delivered_at')
        .in('id', orderIds);

      const orderDetails = await Promise.all((ordersData || []).map(async (order) => {
        const clientName = order.client_id ? getClientName(order.client_id) : 'Client';
        const { count } = await supabase
          .from('order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', order.id);

        return {
          id: order.id,
          clientName,
          articles: count || 0,
          totalAmount: order.base_amount || order.total_amount,
          netAmount: (order.base_amount || order.total_amount) * (1 - PLATFORM_COMMISSION),
          deliveredAt: new Date(order.delivered_at)
        };
      }));

      setSelectedTransferDetails({ transfer, orders: orderDetails });
    } catch (error) {
      console.error('Error loading transfer details:', error);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tresorerie</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestion des reversements aux fournisseurs</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Fournisseurs a regler</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{supplierPayments.length}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Commandes en attente</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalPendingOrders}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Montant a reverser</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{formatPrice(totalPendingAmount)}</p>
              </div>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4 flex items-center">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Structure des commissions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{(PLATFORM_COMMISSION * 100).toFixed(0)}%</div>
              <div className="text-sm sm:text-base text-blue-800">Commission plateforme</div>
              <p className="text-xs text-gray-500 mt-1">Prelevee sur le montant de l'offre</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">{((1 - PLATFORM_COMMISSION) * 100).toFixed(0)}%</div>
              <div className="text-sm sm:text-base text-green-800">Reverse au fournisseur</div>
              <p className="text-xs text-gray-500 mt-1">Montant net apres commission</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-3 sm:mt-4">
            Note : Les frais de traitement ({commissionSettings.clientCommission}%) sont payes par le client et ne sont pas deduits du montant du fournisseur.
          </p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Fournisseurs a regler</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Cliquez sur un fournisseur pour voir le detail et effectuer le virement
                </p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {filteredSupplierPayments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {supplierSearchQuery ? 'Aucun resultat' : 'Tous les paiements sont a jour'}
              </h3>
              <p className="text-sm text-gray-500">
                {supplierSearchQuery ? 'Aucun fournisseur ne correspond a votre recherche' : 'Aucun reversement en attente'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSupplierPayments.map((supplier) => (
                <div 
                  key={supplier.supplierId} 
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleShowDetails(supplier)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-base">
                          {supplier.supplierName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">{supplier.supplierName}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{supplier.orderCount} commande(s)</span>
                          </span>
                          <span className="hidden sm:flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Dernière: {formatDate(supplier.lastOrderDate)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4 pl-13 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-2xl font-bold text-green-600">
                          {formatPrice(supplier.totalAmount)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Montant net à reverser</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 hidden sm:block" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Historique des Virements</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{filteredTransfers.length} virement(s)</p>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={transferSearchQuery}
                  onChange={(e) => setTransferSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {isLoadingTransfers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des virements...</p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {transferSearchQuery ? 'Aucun virement trouve' : 'Aucun virement effectue'}
              </p>
              <p className="text-gray-400 text-sm">
                {transferSearchQuery ? 'Modifiez votre recherche' : 'Les virements effectues apparaitront ici'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewTransferDetails(transfer)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{transfer.supplierName}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {transfer.orderCount} commande(s) - {formatDate(transfer.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-3 pl-6 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm sm:text-base font-bold text-green-600">{formatPrice(transfer.amount)}</p>
                        <p className="text-xs text-green-500 capitalize">{getTransferStatusLabel(transfer.status)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Details Modal */}
      {showDetailsModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[95vh] sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base sm:text-xl">
                      {selectedSupplier.supplierName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedSupplier.supplierName}</h2>
                    <p className="text-xs sm:text-base text-gray-600">
                      {selectedSupplier.orderCount} commande(s) à régler • 
                      Montant net: {formatPrice(selectedSupplier.totalAmount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>


              {/* Orders List */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Détail des commandes</h3>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {selectedSupplier.orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-sm sm:text-base font-bold text-gray-900">#{order.id}</span>
                            <span className="px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Livrée
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {formatDate(order.deliveredAt || order.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium text-gray-900 ml-1 sm:ml-2">{getClientName(order.clientId)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Articles:</span>
                            <span className="font-medium text-gray-900 ml-1 sm:ml-2">{order.items.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Montant commande:</span>
                            <span className="font-medium text-gray-900 ml-1 sm:ml-2">{formatPrice(order.baseAmount || order.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Net fournisseur:</span>
                            <span className="font-bold text-green-600 ml-1 sm:ml-2">
                              {formatPrice((order.baseAmount || order.totalAmount) * (1 - PLATFORM_COMMISSION))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Action */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-bold text-yellow-900 mb-2">Confirmation de virement</h4>
                    <p className="text-xs sm:text-sm text-yellow-800 mb-3 sm:mb-4">
                      Vous allez effectuer un virement de <strong>{formatPrice(selectedSupplier.totalAmount)}</strong> 
                      à <strong>{selectedSupplier.supplierName}</strong> pour {selectedSupplier.orderCount} commande(s).
                    </p>
                    <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>Le statut de toutes les commandes passera à "Paiement reversé"</li>
                      <li>Le fournisseur recevra une notification de virement</li>
                      <li>Cette action est irréversible</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleProcessPayment(selectedSupplier)}
                  disabled={!!processingPayment}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
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

      {selectedTransferDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[90vh] sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">
                      {selectedTransferDetails.transfer.supplierName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{selectedTransferDetails.transfer.supplierName}</h2>
                    <p className="text-xs sm:text-base text-gray-600">
                      Virement du {formatDate(selectedTransferDetails.transfer.createdAt)} - {formatPrice(selectedTransferDetails.transfer.amount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTransferDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Detail des commandes</h3>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {selectedTransferDetails.orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-sm sm:text-base font-bold text-gray-900">#{order.id.substring(0, 8).toUpperCase()}</span>
                            <span className="px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Livree
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {formatDate(order.deliveredAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium text-gray-900 ml-1">{order.clientName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Articles:</span>
                            <span className="font-medium text-gray-900 ml-1">{order.articles}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Montant commande:</span>
                            <span className="font-medium text-gray-900 ml-1">{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Net fournisseur:</span>
                            <span className="font-bold text-green-600 ml-1">{formatPrice(order.netAmount)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedTransferDetails(null)}
                  className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-200 transition-colors"
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