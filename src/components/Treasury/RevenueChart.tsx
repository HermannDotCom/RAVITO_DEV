import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Bar
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface RevenueChartProps {
  data: { month: string; revenue: number; commission: number }[];
  title?: string;
  formatPrice?: (price: number) => string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = "Revenus mensuels",
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA'
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-green-500" />
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-600">Revenus nets</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span className="text-gray-600">Commissions</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatPrice(value),
                name === 'revenue' ? 'Revenus nets' : 'Commissions'
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]}
              name="revenue"
            />
            <Line
              type="monotone"
              dataKey="commission"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
              name="commission"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
