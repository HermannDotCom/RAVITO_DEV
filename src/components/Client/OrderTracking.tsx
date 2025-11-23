import React, { useEffect, useState, useRef } from 'react';
import { Clock, Package, Truck, CheckCircle, MapPin, Phone, Archive } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { OrderStatus, CrateType } from '../../types';
import { DeliveryTracking } from './DeliveryTracking';
import { supabase } from '../../lib/supabase';

interface OrderTrackingProps {
  onComplete: () => void;
}

interface SupplierProfile {
  id: string;
  name: string;
  business_name?: string;
  phone?: string;
  rating?: number;
  address?: string;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ onComplete }) => {
  const { clientCurrentOrder, updateOrderStatus } = useOrder();
  const [estimatedTime, setEstimatedTime] = useState(25);
  const [notifications, setNotifications] = useState<Array<{ type: string; message: string; id: number }>>([]);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Load supplier profile when order has a supplier
  useEffect(() => {
    const loadSupplierProfile = async () => {
      if (!clientCurrentOrder?.supplierId) {
        setSupplierProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, business_name, phone, rating, address')
        .eq('id', clientCurrentOrder.supplierId)
        .maybeSingle();

      if (error) {
        console.error('Error loading supplier profile:', error);
        return;
      }

      if (data) {
        setSupplierProfile({
          id: data.id,
          name: data.name,
          business_name: data.business_name,
          phone: data.phone,
          rating: data.rating,
          address: data.address
        });
      }
    };

    loadSupplierProfile();
  }, [clientCurrentOrder?.supplierId]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // Handle notifications from DeliveryTracking component
  const handleNotification = (type: string, message: string) => {
    const newNotification = { type, message, id: Date.now() };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after 5 seconds
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      timeoutsRef.current.delete(timeoutId);
    }, 5000);
    
    timeoutsRef.current.add(timeoutId);
  };

  useEffect(() => {
    if (!clientCurrentOrder) return;

    const statusFlow: OrderStatus[] = ['accepted', 'preparing', 'delivering', 'delivered'];
    let currentIndex = statusFlow.indexOf(clientCurrentOrder.status);

    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < statusFlow.length) {
        updateOrderStatus(clientCurrentOrder.id, statusFlow[currentIndex]);
        
        if (statusFlow[currentIndex] === 'delivered') {
          clearInterval(interval);
          setTimeout(onComplete, 2000);
        } else {
          setEstimatedTime(prev => Math.max(5, prev - 8));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [clientCurrentOrder, updateOrderStatus, onComplete]);

  if (!clientCurrentOrder) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Aucune commande en cours</h3>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Recherche de fournisseur', icon: Clock, color: 'yellow' };
      case 'awaiting-client-validation':
        return { label: 'Offre reçue - En attente de validation', icon: Clock, color: 'orange' };
      case 'accepted':
        return { label: 'Commande acceptée', icon: CheckCircle, color: 'green' };
      case 'preparing':
        return { label: 'Préparation en cours', icon: Package, color: 'blue' };
      case 'delivering':
        return { label: 'En route vers vous', icon: Truck, color: 'orange' };
      case 'delivered':
        return { label: 'Livré !', icon: CheckCircle, color: 'green' };
      default:
        return { label: 'En attente', icon: Clock, color: 'gray' };
    }
  };

  const statusInfo = getStatusInfo(clientCurrentOrder.status);
  const StatusIcon = statusInfo.icon;

  const steps = [
    { id: 'accepted', label: 'Acceptée', icon: CheckCircle },
    { id: 'preparing', label: 'Préparation', icon: Package },
    { id: 'delivering', label: 'En route', icon: Truck },
    { id: 'delivered', label: 'Livrée', icon: CheckCircle }
  ];

  const getCurrentStep = () => {
    return steps.findIndex(step => step.id === clientCurrentOrder.status);
  };

  // Calculate totals
  const subtotal = clientCurrentOrder.items.reduce((sum, item) => 
    sum + (item.product.pricePerUnit * item.quantity), 0
  );
  
  const consigneTotal = clientCurrentOrder.items.reduce((sum, item) => 
    sum + (item.withConsigne ? item.product.consigneAmount * item.quantity : 0), 0
  );
  
  const total = subtotal + consigneTotal;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Notification Toast */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`
                p-4 rounded-lg shadow-lg border max-w-md animate-slide-in
                ${notification.type === 'success' ? 'bg-green-50 border-green-200' : ''}
                ${notification.type === 'warning' ? 'bg-orange-50 border-orange-200' : ''}
                ${notification.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
              `}
            >
              <p className={`
                text-sm font-medium
                ${notification.type === 'success' ? 'text-green-800' : ''}
                ${notification.type === 'warning' ? 'text-orange-800' : ''}
                ${notification.type === 'info' ? 'text-blue-800' : ''}
              `}>
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi de commande</h1>
        <p className="text-gray-600">Commande #{clientCurrentOrder.id}</p>
      </div>

      {/* GPS Delivery Tracking - Show when delivering */}
      {clientCurrentOrder.status === 'delivering' && (
        <DeliveryTracking order={clientCurrentOrder} onNotification={handleNotification} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-${statusInfo.color}-100`}>
                <StatusIcon className={`h-6 w-6 text-${statusInfo.color}-600`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{statusInfo.label}</h2>
                {clientCurrentOrder.status !== 'delivered' && (
                  <p className="text-gray-600">Temps estimé: {estimatedTime} minutes</p>
                )}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="relative">
              <div className="flex justify-between">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index <= getCurrentStep();
                  const isCurrent = index === getCurrentStep();
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center relative">
                      <div className={`
                        h-10 w-10 rounded-full flex items-center justify-center transition-all
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }
                      `}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        isCompleted ? 'text-green-600' : isCurrent ? 'text-orange-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                      
                      {index < steps.length - 1 && (
                        <div className={`
                          absolute top-5 left-5 w-16 h-0.5 transition-colors
                          ${index < getCurrentStep() ? 'bg-green-500' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          {clientCurrentOrder.supplierId && supplierProfile && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Votre fournisseur</h3>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {(supplierProfile.business_name || supplierProfile.name).substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {supplierProfile.business_name || supplierProfile.name}
                  </h4>
                  {supplierProfile.address && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{supplierProfile.address}</span>
                    </div>
                  )}
                  {supplierProfile.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>{supplierProfile.phone}</span>
                    </div>
                  )}
                </div>
                {supplierProfile.rating && supplierProfile.rating > 0 && (
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-semibold">{supplierProfile.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Détails de la commande</h3>
            
            <div className="space-y-3">
              {clientCurrentOrder.items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.product.name}</span>
                    <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                    {item.withConsigne && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded ml-2">
                        Avec consigne
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.product.pricePerUnit * item.quantity + 
                      (item.withConsigne ? item.product.consigneAmount * item.quantity : 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total produits</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {consigneTotal > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Total consignes</span>
                  <span>{formatPrice(consigneTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Crate Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Archive className="h-4 w-4 mr-2 text-blue-600" />
              Gestion des casiers (interchangeables par type)
            </h3>
            
            {(() => {
              // Calculate crate summary by type (cumulative)
              const crateSummary: { [key in CrateType]: number } = {
                C24: 0,
                C12: 0,
                C12V: 0,
                C6: 0
              };

              clientCurrentOrder.items.forEach(item => {
                if (!item.withConsigne) {
                  crateSummary[item.product.crateType] += item.quantity;
                }
              });

              const totalCratesToReturn = Object.values(crateSummary).reduce((sum, count) => sum + count, 0);
              const cratesWithConsigne = clientCurrentOrder.items.filter(item => item.withConsigne);
              
              return (
                <div className="space-y-3">
                  {totalCratesToReturn > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-800 mb-3">Casiers vides à rendre (interchangeables) :</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        {Object.entries(crateSummary).map(([crateType, count]) => (
                          count > 0 && (
                            <div key={crateType} className="bg-white rounded p-3 text-center">
                              <div className="text-lg font-bold text-blue-700">{count}</div>
                              <div className="text-blue-600 text-sm">{crateType}</div>
                              <div className="text-blue-500 text-xs mt-1">
                                {crateType === 'C24' ? '24×33cl' : 
                                 crateType === 'C12' ? '12×66cl' : 
                                 crateType === 'C12V' ? '12×75cl' : '6×1.5L'}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                      <div className="bg-white border border-blue-300 rounded-lg p-3">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          ⚠️ <strong>Total : {totalCratesToReturn} casier(s) vide(s) à rendre obligatoirement</strong>
                        </p>
                        <p className="text-xs text-blue-700">
                          💡 <strong>Casiers interchangeables :</strong> Vous pouvez rendre n'importe quel casier vide du même type, 
                          peu importe la marque d'origine (ex: casier C24 Flag = casier C24 Castel).
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {cratesWithConsigne.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-orange-800 mb-2">Consignes incluses :</p>
                      <div className="space-y-1">
                        {cratesWithConsigne.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-orange-700">{item.quantity} casier(s) {item.product.crateType}</span>
                            <span className="text-orange-600 font-medium">
                              {formatPrice(item.product.consigneAmount * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {totalCratesToReturn === 0 && cratesWithConsigne.length === 0 && (
                    <p className="text-sm text-blue-700">Aucun casier à gérer</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Livraison et paiement</h3>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{clientCurrentOrder.deliveryAddress}</span>
            </div>
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-sm text-yellow-800">
                <strong>Paiement :</strong> {getPaymentMethodLabel(clientCurrentOrder.paymentMethod)} à la livraison
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};