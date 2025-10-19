import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info, Trash2, Mail, MailOpen } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'account_approved':
      case 'zone_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'account_rejected':
      case 'zone_rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? '50' : '100';
    switch (type) {
      case 'account_approved':
      case 'zone_approved':
        return `bg-green-${opacity}`;
      case 'account_rejected':
      case 'zone_rejected':
        return `bg-red-${opacity}`;
      case 'warning':
        return `bg-yellow-${opacity}`;
      default:
        return `bg-blue-${opacity}`;
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-orange-400 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-orange-600'
                    : 'bg-orange-400 text-white hover:bg-orange-300'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-white text-orange-600'
                    : 'bg-orange-400 text-white hover:bg-orange-300'
                }`}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-white hover:text-orange-100 underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Mail className="h-12 w-12 mb-2 text-gray-300" />
              <p className="text-sm">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-orange-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-semibold ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <MailOpen className="h-4 w-4 text-orange-600 flex-shrink-0 ml-2" />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-center text-gray-500">
              {notifications.length} notification(s) au total
            </p>
          </div>
        )}
      </div>
    </>
  );
};
