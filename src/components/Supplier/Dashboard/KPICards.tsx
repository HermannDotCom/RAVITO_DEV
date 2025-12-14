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
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: boolean;
  onClick?: () => void;
}

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
      label: 'Commandes disponibles',
      value: availableOrders,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
      badge: availableOrders > 0,
      onClick: onAvailableClick,
    },
    {
      label: 'Livraisons actives',
      value: activeDeliveries,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: "Livrées aujourd'hui",
      value: todayDelivered,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Revenus du mois',
      value: formatPrice(monthlyRevenue),
      icon: Wallet,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <button
            key={kpi.label}
            onClick={kpi.onClick}
            disabled={!kpi.onClick}
            className={`relative overflow-hidden bg-white border ${kpi.borderColor} rounded-2xl p-5 text-left transition-all ${
              kpi.onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default'
            }`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 ${kpi.bgColor} rounded-full -mr-10 -mt-10 opacity-20`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                {kpi.badge && (
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full animate-bounce">
                    {availableOrders}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">
                  {kpi.value}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
