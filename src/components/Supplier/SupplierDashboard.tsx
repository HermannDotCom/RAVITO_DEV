import React, { useState } from 'react';
import { Package, Truck, Clock, TrendingUp, Star, MapPin, Phone, Eye, CheckCircle, X, AlertCircle, Archive, CreditCard, User, BarChart3, Zap } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { CrateType } from '../../types';

interface SupplierDashboardProps {
  onNavigate: (section: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();

  const accessRestrictions = getAccessRestrictions();

  // Vérification sécurisée de l'accès
  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">
            {user?.role === 'supplier' ? 'Dépôt en cours de validation' : 'Accès restreint'}
          </h2>
          <p className="text-orange-800 mb-6">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-orange-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">Dépôt soumis :</h3>
            <div className="text-sm text-orange-800 space-y-1 text-left">
              <p><strong>Dépôt :</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable :</strong> {user.name}</p>
              <p><strong>Zone de couverture :</strong> {(user as any)?.coverageZone || 'Non renseignée'}</p>
              <p><strong>Capacité :</strong> {(user as any)?.deliveryCapacity || 'Non renseignée'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Documents requis :</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>✓ Pièce d'identité</li>
                <li>✓ Justificatif d'adresse</li>
                <li>⏳ Licence commerciale</li>
                <li>⏳ Assurance véhicule</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Après approbation :</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Accès aux commandes</li>
                <li>• Gestion des livraisons</li>
                <li>• Reversements automatiques</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
          </div>
          <div className="text-sm text-orange-700">
            <p className="mb-2"><strong>Délai d'approbation :</strong> 24-72 heures</p>
            <p>Contact : <strong>partenaires@distri-night.ci</strong> ou <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Commandes disponibles',
      value: availableOrders.length,
      icon: Package,
      color: 'orange',
      action: () => onNavigate('orders')
    },
    {
      label: 'En livraison',
      value: 0,
      icon: Truck,
      color: 'blue'
    },
    {
      label: 'Note moyenne',
      value: user?.rating || 5,
      icon: Star,
      color: 'yellow'
    },
    {
      label: 'Total livraisons',
      value: user?.totalOrders || 0,
      icon: TrendingUp,
      color: 'green'
    }
  ];

  const handleShowDetails = (order: any) => {
    onNavigate('orders');
  };


  const getCrateSummary = (order: any) => {
    const crateSummary: { [key in CrateType]: { withConsigne: number; toReturn: number } } = {
      C24: { withConsigne: 0, toReturn: 0 },
      C12: { withConsigne: 0, toReturn: 0 },
      C12V: { withConsigne: 0, toReturn: 0 },
      C6: { withConsigne: 0, toReturn: 0 }
    };

    // Mock items for dashboard orders
    const mockItems = [
      { product: { crateType: 'C24' as CrateType }, quantity: 2, withConsigne: false },
      { product: { crateType: 'C12' as CrateType }, quantity: 1, withConsigne: true }
    ];

    mockItems.forEach(item => {
      if (item.withConsigne) {
        crateSummary[item.product.crateType].withConsigne += item.quantity;
      } else {
        crateSummary[item.product.crateType].toReturn += item.quantity;
      }
    });

    return crateSummary;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {(user as any)?.businessName || 'Tableau de Bord Fournisseur'}
        </h1>
        <p className="text-gray-600">
          Responsable: {user?.name} • Gérez vos livraisons et commandes disponibles
        </p>
      </div>

      {/* Intelligence Dashboard CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="text-xl font-bold mb-1">Intelligence Dashboard</h3>
              <p className="text-purple-100 text-sm">
                Advanced analytics, demand forecasting, and market insights
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('intelligence')}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Zap className="h-5 w-5" />
            Access Dashboard
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${
                stat.action ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
              }`}
              onClick={stat.action}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.icon === Star ? `${stat.value}/5` : stat.value}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <StatIcon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Orders */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Commandes disponibles</h3>
        
        {availableOrders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande disponible pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{order.clientName}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{order.clientRating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{order.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{order.items.length} article(s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{order.distance} • ~{order.estimatedTime} min</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </span>
                      {order.consigneTotal > 0 && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                          Consigne incluse
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleShowDetails(order)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Voir les détails</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
