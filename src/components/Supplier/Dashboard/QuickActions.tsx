import React from 'react';
import { Package, BarChart3, Wallet } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (section: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      label: '📦 Commandes',
      icon: Package,
      section: 'orders',
      color: 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100',
    },
    {
      label: '📊 Historique',
      icon: BarChart3,
      section: 'history',
      color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100',
    },
    {
      label: '💰 Trésorerie',
      icon: Wallet,
      section: 'treasury',
      color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">⚡ Actions rapides</h3>

      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.section}
              onClick={() => onNavigate(action.section)}
              className={`p-4 rounded-xl border text-center transition-colors ${action.color}`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
