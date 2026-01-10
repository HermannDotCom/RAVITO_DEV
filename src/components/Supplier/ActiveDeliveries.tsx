import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone, Clock, CheckCircle, Package, Navigation, Archive, AlertCircle, X, Key, Users } from 'lucide-react';
import { Order, OrderStatus, CrateType } from '../../types';
import { useOrder } from '../../context/OrderContext';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { RatingBadge } from '../Shared/RatingBadge';

interface ActiveDeliveriesProps {
  onNavigate: (section: string) => void;
}

interface ClientProfile {
  id: string;
  name: string;
  business_name?: string;
  phone?: string;
  rating?: number;
}

interface TeamMember {
  id: string;
  name: string;
}

export const ActiveDeliveries: React.FC<ActiveDeliveriesProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { supplierActiveDeliveries, updateOrderStatus, assignDeliveryDriver } = useOrder();
  const { showToast } = useToast();
  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'assignment'>('deliveries');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  const accessRestrictions = getAccessRestrictions();

  useEffect(() => {
    const loadClientProfiles = async () => {
      if (supplierActiveDeliveries.length === 0) return;

      // Get unique client IDs from active deliveries
      const clientIds = [...new Set(supplierActiveDeliveries.map(order => order.clientId))];

      // Query profiles table directly
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, business_name, phone, rating')
        .in('id', clientIds);

      if (error) {
        console.error('Error loading client profiles:', error);
        return;
      }

      // Create profiles map
      const profilesMap: Record<string, ClientProfile> = {};
      profiles?.forEach(profile => {
        profilesMap[profile.id] = {
          id: profile.id,
          name: profile.name,
          business_name: profile.business_name,
          phone: profile.phone,
          rating: profile.rating
        };
      });

      setClientProfiles(profilesMap);
    };

    loadClientProfiles();
  }, [supplierActiveDeliveries]);

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user?.id) return;

      // Get organization for the current user (handles both owner and member cases)
      // First, check if user is an owner
      const { data: ownedOrgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id);

      let organizationId: string | null = null;

      if (ownedOrgs && ownedOrgs.length > 0) {
        // User is an owner - use first organization (suppliers typically have one)
        organizationId = ownedOrgs[0].id;
      } else {
        // User might be a member - check organization_members
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (memberData) {
          organizationId = memberData.organization_id;
        }
      }

      if (!organizationId) {
        console.log('No organization found for user');
        return;
      }

      // Get members with driver/delivery role - without join to avoid RLS issues
      const { data: membersList, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_active', true)
        .in('role', ['driver', 'delivery', 'employee', 'manager']);

      if (membersError) {
        console.error('Error loading team members:', membersError);
        return;
      }

      if (!membersList || membersList.length === 0) {
        console.log('No members found in organization');
        setTeamMembers([]);
        return;
      }

      // Fetch profiles separately for each member to avoid RLS join issues
      const profilePromises = membersList.map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, business_name')
          .eq('id', member.user_id)
          .maybeSingle();

        if (!profile) {
          return null;
        }

        return {
          id: member.user_id,
          name: profile.name || profile.business_name || 'Membre'
        };
      });

      const profiles = await Promise.all(profilePromises);
      const validProfiles = profiles.filter((p): p is TeamMember => p !== null);

      console.log(`Loaded ${validProfiles.length} team members`);
      setTeamMembers(validProfiles);
    };

    loadTeamMembers();
  }, [user]);

  const handleOpenMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleContactClient = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return { label: 'Payée', color: 'emerald', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' };
      case 'accepted':
        return { label: 'Acceptée', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
      case 'preparing':
        return { label: 'En préparation', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
      case 'delivering':
        return { label: 'En livraison', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
      case 'delivered':
        return { label: 'Livrée', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
      default:
        return { label: 'En attente', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
    }
  };

  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return { label: 'Commencer préparation', nextStatus: 'preparing' as OrderStatus };
      case 'accepted':
        return { label: 'Commencer préparation', nextStatus: 'preparing' as OrderStatus };
      case 'preparing':
        return { label: 'Partir en livraison', nextStatus: 'delivering' as OrderStatus };
      case 'delivering':
        return { label: 'Marquer comme livré', nextStatus: 'delivered' as OrderStatus };
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      orange: 'Orange Money',
      mtn: 'MTN Mobile Money',
      moov: 'Moov Money',
      wave: 'Wave',
      card: 'Carte bancaire'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getPaymentStatusInfo = (order: Order) => {
    if (order.status === 'paid' || order.paymentStatus === 'paid') {
      return {
        color: 'green',
        icon: CheckCircle,
        label: 'Paiement confirmé',
        method: getPaymentMethodLabel(order.paymentMethod),
        date: order.paidAt ? formatDate(order.paidAt.toString()) : 'N/A'
      };
    }
    return {
      color: 'yellow',
      icon: AlertCircle,
      label: 'À collecter',
      method: getPaymentMethodLabel(order.paymentMethod),
      date: null
    };
  };

  const getCrateSummary = (order: Order) => {
    // Initialize summary for traditional crate types used in consigne management
    // Note: Other crate types (CARTON24, PACK6, PACK12, C20) don't use the traditional
    // crate consigne system and are intentionally excluded from this summary
    const crateSummary: { [key in CrateType]: { withConsigne: number; toReturn: number } } = {
      C24: { withConsigne: 0, toReturn: 0 },
      C12: { withConsigne: 0, toReturn: 0 },
      C12V: { withConsigne: 0, toReturn: 0 },
      C6: { withConsigne: 0, toReturn: 0 }
    };
    
    // Verify that order.items exists and is an array
    if (!order.items || !Array.isArray(order.items)) {
      return crateSummary;
    }
    
    order.items.forEach(item => {
      // Triple verification: item exists, product exists, crateType exists and is valid
      if (!item || !item.product) return;
      
      const crateType = item.product.crateType as CrateType;
      
      // Verify that the crateType is a valid key of crateSummary
      // This filters out non-traditional crate types like CARTON24, PACK6, etc.
      if (!crateType || !crateSummary[crateType]) return;
      
      const quantity = item.quantity || 0;
      
      if (item.withConsigne) {
        crateSummary[crateType].withConsigne += quantity;
      } else {
        crateSummary[crateType].toReturn += quantity;
      }
    });
    return crateSummary;
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'delivered') {
      const order = supplierActiveDeliveries.find(o => o.id === orderId);
      if (order) {
        setSelectedOrderForDelivery(order);
        setShowConfirmationModal(true);
        setConfirmationCode('');
        setCodeError('');
        return;
      }
    }
    await updateOrderStatus(orderId, newStatus);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrderForDelivery) return;
    setCodeError('');
    setIsValidating(true);

    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_confirmation_code')
        .eq('id', selectedOrderForDelivery.id)
        .single();

      if (fetchError || !orderData) {
        setCodeError('Erreur lors de la vérification du code');
        setIsValidating(false);
        return;
      }

      const dbCode = orderData.delivery_confirmation_code;
      if (confirmationCode.trim().length !== 8) {
        setCodeError('Le code doit contenir 8 caractères');
        setIsValidating(false);
        return;
      }
      if (confirmationCode.toUpperCase() !== dbCode) {
        setCodeError('Code incorrect. Veuillez demander le code au client.');
        setIsValidating(false);
        return;
      }

      const success = await updateOrderStatus(selectedOrderForDelivery.id, 'delivered');
      if (!success) {
        setCodeError('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
        setIsValidating(false);
        return;
      }
      setShowConfirmationModal(false);
      setSelectedOrderForDelivery(null);
      setConfirmationCode('');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      setCodeError('Erreur lors de la confirmation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedOrderForAssignment || !selectedDriver) return;

    const driverName = teamMembers.find(m => m.id === selectedDriver)?.name || 'le livreur';
    const orderNumber = selectedOrderForAssignment.orderNumber || selectedOrderForAssignment.id.substring(0, 8);

    const success = await assignDeliveryDriver(selectedOrderForAssignment.id, selectedDriver);
    if (success) {
      showToast(`Livraison affectée à ${driverName} avec succès`, 'success');
      setShowAssignModal(false);
      setSelectedOrderForAssignment(null);
      setSelectedDriver('');
    } else {
      showToast('Erreur lors de l\'affectation du livreur. Veuillez réessayer.', 'error');
    }
  };

  const ordersAwaitingAssignment = supplierActiveDeliveries.filter(order =>
    ['paid', 'accepted', 'preparing'].includes(order.status)
  );

  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">Livraisons non accessibles</h2>
          <p className="text-orange-800">
            {accessRestrictions.restrictionReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Livraisons</h1>
        <p className="text-gray-600">Gérez vos livraisons actives et affectez des livreurs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-6 py-3 font-medium ${activeTab === 'deliveries' 
            ? 'border-b-2 border-orange-500 text-orange-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Truck className="h-4 w-4 inline mr-2" />
          Livraisons en cours
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`px-6 py-3 font-medium ${activeTab === 'assignment' 
            ? 'border-b-2 border-orange-500 text-orange-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Affectation Livreurs
        </button>
      </div>

      {activeTab === 'deliveries' && (
        <>
          {supplierActiveDeliveries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune livraison en cours</h3>
              <p className="text-gray-500 mb-6">Acceptez des commandes pour commencer vos livraisons</p>
              <button
                onClick={() => onNavigate('orders')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Voir les commandes disponibles
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {supplierActiveDeliveries.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const nextAction = getNextAction(order.status);
            const crateSummary = getCrateSummary(order);
            const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
            const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
              const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
              return sum + (counts.withConsigne * consignePrice);
            }, 0);

            const clientProfile = clientProfiles[order.clientId];
            const clientName = clientProfile?.business_name || clientProfile?.name || 'Client';
            const clientPhone = clientProfile?.phone || '';
            const clientRating = clientProfile?.rating || 0;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Order Header with Number */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">
                      Commande #{order.orderNumber || order.id.substring(0, 8)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-orange-100 text-sm mt-1">
                    Créée le {formatDate(order.createdAt.toString())}
                  </p>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Info & Address */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                        Informations client
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Établissement</span>
                          <span className="font-medium">{clientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact</span>
                          <span className="font-medium">{clientPhone}</span>
                        </div>
                        {clientRating > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Note client</span>
                            <RatingBadge
                              rating={clientRating}
                              reviewCount={1}
                              userId={order.clientId}
                              userType="client"
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Adresse de livraison</h4>
                      <p className="text-gray-700 text-sm mb-3">{order.deliveryAddress}</p>
                      <button
                        onClick={() => handleOpenMaps(order.deliveryAddress)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        <span className="text-sm font-medium">Ouvrir dans Maps</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Details + Crates + Payment */}
                  <div className="space-y-4 lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Détails de la commande</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.product.name} ({item.product.packaging})
                            </span>
                            <span className="font-medium">
                              {formatPrice(item.product.pricePerUnit * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.consigneTotal > 0 && (
                          <div className="flex justify-between items-center text-sm text-orange-600 border-t border-gray-200 pt-2">
                            <span>Consignes incluses</span>
                            <span className="font-medium">{formatPrice(order.consigneTotal)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between items-center font-bold">
                            <span>Total</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Crate Management */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Archive className="h-4 w-4 mr-2 text-blue-600" />
                        Gestion des casiers
                      </h4>
                      {totalCratesToReturn > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-blue-800 mb-2">À récupérer du client :</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(crateSummary).map(([crateType, counts]) => (
                              counts.toReturn > 0 && (
                                <div key={crateType} className="bg-white rounded p-2 text-center">
                                  <div className="font-bold text-blue-700">{counts.toReturn}</div>
                                  <div className="text-blue-600 text-xs">{crateType}</div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      {totalConsigneAmount > 0 && (
                        <div className="border-t border-blue-200 pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Consignes incluses</span>
                            <span className="font-bold text-blue-800">{formatPrice(totalConsigneAmount)}</span>
                          </div>
                        </div>
                      )}
                      {totalCratesToReturn === 0 && totalConsigneAmount === 0 && (
                        <p className="text-sm text-blue-700">Aucun casier à gérer</p>
                      )}
                    </div>
                    {/* Paiement */}
                    {(() => {
                      const paymentInfo = getPaymentStatusInfo(order);
                      const PaymentIcon = paymentInfo.icon;
                      const bgColor = paymentInfo.color === 'green' ? 'bg-green-50' : 'bg-yellow-50';
                      const iconColor = paymentInfo.color === 'green' ? 'text-green-600' : 'text-yellow-600';
                      const textColor = paymentInfo.color === 'green' ? 'text-green-700' : 'text-yellow-700';
                      const subTextColor = paymentInfo.color === 'green' ? 'text-green-600' : 'text-yellow-600';
                      return (
                        <div className={`${bgColor} rounded-lg p-4`}>
                          <h4 className="font-semibold text-gray-900 mb-2">Paiement</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <PaymentIcon className={`h-4 w-4 ${iconColor}`} />
                              <span className={`text-sm ${textColor} font-medium`}>
                                {paymentInfo.label} : {paymentInfo.method}
                              </span>
                            </div>
                            {paymentInfo.date ? (
                              <p className={`text-xs ${subTextColor}`}>
                                Payé le {paymentInfo.date}
                              </p>
                            ) : (
                              <p className={`text-xs ${subTextColor}`}>
                                Le paiement sera effectué à la livraison
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  {/* Action Buttons */}
                  {nextAction && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleContactClient(clientPhone)}
                        disabled={!clientPhone}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Contacter le client</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order.id, nextAction.nextStatus)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>{nextAction.label}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {activeTab === 'assignment' && (
        <>
          {ordersAwaitingAssignment.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune commande à affecter</h3>
              <p className="text-gray-500">Les commandes payées, acceptées ou en préparation apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordersAwaitingAssignment.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const clientProfile = clientProfiles[order.clientId];
                const clientName = clientProfile?.business_name || clientProfile?.name || 'Client';
                const assignedMember = teamMembers.find(m => m.id === order.assignedDeliveryUserId);

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Commande #{order.orderNumber || order.id.substring(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{clientName}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt.toString())}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Montant total</p>
                        <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Adresse de livraison</p>
                        <p className="text-sm font-medium text-gray-900">{order.deliveryAddress}</p>
                      </div>
                    </div>

                    {assignedMember ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Livreur assigné</p>
                            <p className="text-sm text-green-700">{assignedMember.name}</p>
                          </div>
                        </div>
                        {order.assignedDeliveryAt && (
                          <p className="text-xs text-green-600">
                            Le {formatDate(order.assignedDeliveryAt.toString())}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedOrderForAssignment(order);
                          setShowAssignModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
                      >
                        <Users className="h-5 w-5" />
                        <span>Affecter un livreur</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedOrderForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Affecter un livreur</h3>
            <p className="text-gray-600 mb-4">
              Commande #{selectedOrderForAssignment.orderNumber || selectedOrderForAssignment.id.substring(0, 8)}
            </p>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-4"
            >
              <option value="">Sélectionner un livreur</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrderForAssignment(null);
                  setSelectedDriver('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {showConfirmationModal && selectedOrderForDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Key className="h-6 w-6 mr-2 text-orange-600" />
                Confirmation de livraison
              </h3>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setSelectedOrderForDelivery(null);
                  setConfirmationCode('');
                  setCodeError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Pour confirmer la livraison de cette commande, veuillez saisir le code de confirmation fourni par le client.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Commande :</strong> #{selectedOrderForDelivery.orderNumber || selectedOrderForDelivery.id.substring(0, 8)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Montant :</strong> {new Intl.NumberFormat('fr-FR').format(selectedOrderForDelivery.totalAmount)} FCFA
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de confirmation (8 caractères)
              </label>
              <input
                type="text"
                maxLength={8}
                value={confirmationCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setConfirmationCode(value);
                  setCodeError('');
                }}
                placeholder="XXXXXXXX"
                className={`w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 rounded-lg focus:outline-none focus:ring-2 ${
                  codeError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-orange-500 focus:ring-orange-200'
                }`}
              />
              {codeError && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {codeError}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setSelectedOrderForDelivery(null);
                  setConfirmationCode('');
                  setCodeError('');
                }}
                disabled={isValidating}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={isValidating || confirmationCode.length !== 8}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirmer la livraison
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};