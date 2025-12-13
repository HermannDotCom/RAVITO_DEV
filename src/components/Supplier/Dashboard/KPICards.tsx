import React from 'react';
import { Bell, Truck, CheckCircle, Wallet } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardsProps {
  availableOrders: number;
  activeDeliveries: number;
  todayDelivered: number;
  monthlyRevenue: number;
  onAvailableClick?: () => void;
}

interface KPICardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'orange' | 'blue' | 'green' | 'emerald';
  badge?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  orange: 'bg-orange-100 text-orange-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  emerald: 'bg-emerald-100 text-emerald-600',
};

export const KPICards: React.FC<KPICardsProps> = ({
  availableOrders,
  activeDeliveries,
  todayDelivered,
  monthlyRevenue,
  onAvailableClick,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + 'F';
  };

  const kpis: KPICardData[] = [
    {
      label: 'Disponibles',
      value: availableOrders,
      icon: Bell,
      color: 'orange',
      badge: availableOrders > 0,
      onClick: onAvailableClick,
    },
    {
      label: 'En cours',
      value: activeDeliveries,
      icon: Truck,
      color: 'blue',
    },
    {
      label: "Aujourd'hui",
      value: todayDelivered,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Revenus mois',
      value: formatPrice(monthlyRevenue),
      icon: Wallet,
      color: 'emerald',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            onClick={kpi.onClick}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
              kpi.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${colorClasses[kpi.color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              {kpi.badge && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  🔔
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {kpi.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
