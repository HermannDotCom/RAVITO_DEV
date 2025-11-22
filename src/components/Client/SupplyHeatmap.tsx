import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Package, Clock } from 'lucide-react';
import { getZoneDemandHeatmap, ZoneDemand } from '../../services/orderMomentumService';

export const SupplyHeatmap: React.FC = () => {
  const [zoneDemands, setZoneDemands] = useState<ZoneDemand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
    // Refresh every 2 minutes
    const interval = setInterval(loadHeatmap, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadHeatmap = async () => {
    setIsLoading(true);
    const data = await getZoneDemandHeatmap();
    setZoneDemands(data);
    setIsLoading(false);
  };

  // Group by zone
  const zoneGroups = zoneDemands.reduce((acc, demand) => {
    if (!acc[demand.zoneId]) {
      acc[demand.zoneId] = {
        zoneName: demand.zoneName,
        totalOrders: 0,
        products: []
      };
    }
    acc[demand.zoneId].totalOrders += demand.orderCount;
    acc[demand.zoneId].products.push(demand);
    return acc;
  }, {} as Record<string, { zoneName: string; totalOrders: number; products: ZoneDemand[] }>);

  const zones = Object.entries(zoneGroups).map(([zoneId, data]) => ({
    zoneId,
    ...data
  })).sort((a, b) => b.totalOrders - a.totalOrders);

  const maxOrders = Math.max(...zones.map(z => z.totalOrders), 1);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            Supply Heatmap
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Demande en temps réel dans les zones d'Abidjan
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Dernières 2 heures</span>
        </div>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucune activité récente dans les zones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone, index) => {
            const intensity = zone.totalOrders / maxOrders;
            const heatColor = 
              intensity > 0.7 ? 'from-red-500 to-orange-500' :
              intensity > 0.4 ? 'from-orange-500 to-yellow-500' :
              'from-yellow-500 to-green-500';

            return (
              <motion.div
                key={zone.zoneId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
                  {/* Heat bar background */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${intensity * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${heatColor} opacity-20`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-5 w-5 ${
                          intensity > 0.7 ? 'text-red-600' :
                          intensity > 0.4 ? 'text-orange-600' :
                          'text-green-600'
                        }`} />
                        <h3 className="font-bold text-gray-900">{zone.zoneName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {zone.totalOrders}
                        </span>
                        <span className="text-sm text-gray-600">commandes</span>
                      </div>
                    </div>

                    {/* Top products in this zone */}
                    <div className="flex flex-wrap gap-2">
                      {zone.products.slice(0, 3).map((product, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
                          className="bg-white px-3 py-1 rounded-full text-sm border border-gray-200"
                        >
                          <span className="font-medium text-gray-900">{product.productName}</span>
                          <span className="text-orange-600 ml-2">×{product.orderCount}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heat indicator */}
                <div className="flex justify-end mt-1 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-8 rounded-full ${
                        i < intensity * 5 
                          ? intensity > 0.7 ? 'bg-red-500' :
                            intensity > 0.4 ? 'bg-orange-500' :
                            'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-gray-200"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
              <span className="text-gray-600">Très forte demande</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500"></div>
              <span className="text-gray-600">Demande modérée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-yellow-500 to-green-500"></div>
              <span className="text-gray-600">Faible demande</span>
            </div>
          </div>
          <button
            onClick={loadHeatmap}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ↻ Actualiser
          </button>
        </div>
      </motion.div>
    </div>
  );
};
