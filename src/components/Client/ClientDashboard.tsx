import React from 'react';
import { ShoppingCart, Package, Clock, TrendingUp, Star } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useApp } from '../../context/AppContext';

interface ClientDashboardProps {
  onNavigate: (section: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { cart, clientCurrentOrder } = useApp();

  const accessRestrictions = getAccessRestrictions();

  // Vérification sécurisée de l'accès
  if (!accessRestrictions.canPlaceOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-900 mb-4">
            {user?.role === 'client' ? 'Compte en attente d\'approbation' : 'Accès restreint'}
          </h2>
          <p className="text-yellow-800 mb-6">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-yellow-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Informations soumises :</h3>
            <div className="text-sm text-yellow-800 space-y-1 text-left">
              <p><strong>Établissement :</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable :</strong> {user.name}</p>
              <p><strong>Téléphone :</strong> {user.phone}</p>
              <p><strong>Adresse :</strong> {user.address}</p>
            </div>
          </div>
          <div className="text-sm text-yellow-700">
            <p className="mb-2"><strong>Délai d'approbation habituel :</strong> 24-48 heures</p>
            <p>Pour toute question : <strong>support@distri-night.ci</strong> ou <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Articles dans le panier',
      value: cart.length,
      icon: ShoppingCart,
      color: 'orange',
      action: () => onNavigate('cart')
    },
    {
      label: 'Commandes totales',
      value: user?.totalOrders || 0,
      icon: Package,
      color: 'blue'
    },
    {
      label: 'Note moyenne',
      value: user?.rating || 5,
      icon: Star,
      color: 'yellow'
    },
    {
      label: 'En cours',
      value: clientCurrentOrder ? 1 : 0,
      icon: Clock,
      color: 'green',
      action: clientCurrentOrder ? () => onNavigate('tracking') : undefined
    }
  ];

  const quickActions = [
    {
      title: 'Nouvelle commande',
      description: 'Parcourez notre catalogue',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      action: () => onNavigate('catalog')
    },
    {
      title: 'Mon panier',
      description: `${cart.length} article(s)`,
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      action: () => onNavigate('cart')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue chez {(user as any)?.businessName || user?.name}
        </h1>
        <p className="text-gray-600">
          Responsable: {user?.name} • Gérez vos commandes et approvisionnements nocturnes
        </p>
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

      {/* Current Order Alert */}
      {clientCurrentOrder && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-lg font-bold text-orange-900">Commande en cours</h3>
                  <p className="text-orange-700">Commande #{clientCurrentOrder.id} - {clientCurrentOrder.status}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('tracking')}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Suivre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <div
              key={action.title}
              onClick={action.action}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <ActionIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Commande livrée</p>
                  <p className="text-sm text-gray-600">Il y a 2 jours</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Complétée</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Évaluation reçue</p>
                  <p className="text-sm text-gray-600">Il y a 3 jours</p>
                </div>
              </div>
              <span className="text-sm text-blue-600 font-medium">4.5/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};