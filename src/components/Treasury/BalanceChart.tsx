import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface BalanceChartProps {
  data: { date: string; balance: number }[];
  title?: string;
  formatPrice?: (price: number) => string;
}

export const BalanceChart: React.FC<BalanceChartProps> = ({
  data,
  title = "Évolution du solde sur 30 jours",
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA'
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), 'Solde']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ea580c' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
