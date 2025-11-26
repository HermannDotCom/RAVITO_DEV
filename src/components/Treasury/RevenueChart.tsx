import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { ChartDataPoint } from '../../types/treasury';

interface RevenueChartProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Chart type */
  type?: 'bar' | 'line';
  /** Primary color for the chart */
  color?: 'orange' | 'green' | 'blue';
  /** Whether to show the value labels on bars */
  showValues?: boolean;
}

/**
 * RevenueChart Component
 * 
 * Simple bar/line chart for displaying revenue trends over time.
 * No external charting library required - uses pure SVG.
 */
export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Évolution des revenus',
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA',
  type = 'bar',
  color = 'orange',
  showValues = true
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const colorMap = {
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-500',
      light: 'bg-orange-100',
      text: 'text-orange-600',
      fill: '#f97316'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-500',
      light: 'bg-green-100',
      text: 'text-green-600',
      fill: '#22c55e'
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500',
      light: 'bg-blue-100',
      text: 'text-blue-600',
      fill: '#3b82f6'
    }
  };

  const colors = colorMap[color];

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className={`h-5 w-5 ${colors.text}`} />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  // Bar chart rendering
  if (type === 'bar') {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className={`h-5 w-5 ${colors.text}`} />
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Total: {formatValue(totalValue)}</span>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const widthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  {showValues && (
                    <span className={`font-semibold ${colors.text}`}>
                      {formatValue(item.value)}
                    </span>
                  )}
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-700 ease-out`}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Line chart rendering using SVG
  const chartHeight = 180;
  const chartWidth = 400;
  const padding = 40;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding + innerHeight - (d.value / maxValue) * innerHeight,
    ...d
  }));

  const pathD = points.reduce((path, point, i) => {
    return path + `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y} `;
  }, '');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className={`h-5 w-5 ${colors.text}`} />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="text-sm text-gray-500">
          Total: {formatValue(totalValue)}
        </div>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + innerHeight * (1 - ratio)}
            x2={chartWidth - padding}
            y2={padding + innerHeight * (1 - ratio)}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
        ))}

        {/* Area fill */}
        <path
          d={`${pathD} L ${points[points.length - 1]?.x || padding} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`}
          fill={`${colors.fill}20`}
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={colors.fill}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="white"
              stroke={colors.fill}
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
            <span className="text-xs text-gray-600">
              {item.label}: {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
