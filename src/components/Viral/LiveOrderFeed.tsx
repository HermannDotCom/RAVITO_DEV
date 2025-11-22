import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Package, Zap } from 'lucide-react';
import { viralMetricsService } from '../../services/viralMetricsService';
import type { LiveActivityFeed } from '../../types';

export const LiveOrderFeed: React.FC = () => {
  const [activities, setActivities] = useState<LiveActivityFeed[]>([]);
  const [orderVelocity, setOrderVelocity] = useState(0);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const feed = await viralMetricsService.getLiveActivityFeed(10);
      setActivities(feed);

      const velocity = await viralMetricsService.getOrderVelocity();
      setOrderVelocity(velocity);
    } catch (error) {
      console.error('Error loading live activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
        return <Package className="text-blue-500" size={20} />;
      case 'order_completed':
        return <Zap className="text-green-500" size={20} />;
      case 'user_joined':
        return <Users className="text-purple-500" size={20} />;
      default:
        return <TrendingUp className="text-gray-500" size={20} />;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    return `Il y a ${Math.floor(seconds / 3600)} h`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="text-purple-600" size={24} />
          Activité en Temps Réel
        </h3>
        {orderVelocity > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full">
            <Zap className="text-orange-600" size={16} />
            <span className="text-sm font-semibold text-orange-600">
              🔥 {orderVelocity} commandes/heure
            </span>
          </div>
        )}
      </div>

      {orderVelocity >= 20 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 mb-4">
          <p className="font-bold text-center">
            🔥 HEURE DE POINTE - {orderVelocity} commandes en cours!
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucune activité récente</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{activity.anonymizedMessage}</p>
                {activity.zoneName && (
                  <p className="text-xs text-gray-500 mt-1">📍 {activity.zoneName}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400">
                {getTimeAgo(activity.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            ✨ Rejoins {activities.length}+ personnes actives en ce moment!
          </p>
        </div>
      )}
    </div>
  );
};
