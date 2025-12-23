import React, { useState, useEffect } from 'react';
import { Bell, Filter, Trash2, CheckCircle, Settings, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationPreferences } from '../components/Notifications/NotificationPreferences';

type TabType = 'all' | 'preferences';
type FilterType = 'all' | 'unread' | 'orders' | 'deliveries' | 'payments';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filter, setFilter] = useState<FilterType>('all');

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'orders') {
      filtered = filtered.filter(n => 
        n.type.includes('order') || n.type.includes('offer')
      );
    } else if (filter === 'deliveries') {
      filtered = filtered.filter(n => n.type.includes('delivery'));
    } else if (filter === 'payments') {
      filtered = filtered.filter(n => n.type.includes('payment'));
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    if (type.includes('approved') || type.includes('accepted')) {
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    } else if (type.includes('rejected') || type.includes('cancelled')) {
      return <Bell className={`${iconClass} text-red-600`} />;
    } else if (type.includes('payment')) {
      return <Bell className={`${iconClass} text-blue-600`} />;
    } else if (type.includes('delivery')) {
      return <Bell className={`${iconClass} text-purple-600`} />;
    }
    
    return <Bell className={`${iconClass} text-orange-600`} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;

    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Gérez vos notifications et préférences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Préférences</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'preferences' ? (
          <NotificationPreferences />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-600" />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Toutes' },
                      { value: 'unread', label: 'Non lues' },
                      { value: 'orders', label: 'Commandes' },
                      { value: 'deliveries', label: 'Livraisons' },
                      { value: 'payments', label: 'Paiements' }
                    ].map((filterOption) => (
                      <button
                        key={filterOption.value}
                        onClick={() => setFilter(filterOption.value as FilterType)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          filter === filterOption.value
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filterOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Tout marquer comme lu</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {filter === 'unread' 
                      ? 'Vous êtes à jour !' 
                      : 'Les notifications apparaîtront ici'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className={`text-sm font-semibold ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="ml-2 text-xs text-orange-600 hover:text-orange-700 font-medium flex-shrink-0"
                              >
                                Marquer lu
                              </button>
                            )}
                          </div>

                          <p className={`text-sm mb-2 ${
                            !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.created_at)}
                            </span>

                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Footer */}
            {filteredNotifications.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  {filteredNotifications.length} notification(s) affichée(s)
                  {filter !== 'all' && ` • ${notifications.length} au total`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
