import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  mobileVisible?: boolean; // Show in mobile card view
  priority?: number; // Order in mobile view (lower = higher priority)
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Responsive Table Component
 * - Desktop: Classic table layout
 * - Mobile: Transforms into stacked cards
 * - Prioritizes important columns on mobile
 */
export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
}: ResponsiveTableProps<T>) {
  const { isMobile } = useResponsive();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (isMobile) {
    // Mobile: Card view
    const mobileColumns = columns
      .filter(col => col.mobileVisible !== false)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick?.(row)}
            className={`
              bg-white border border-gray-200 rounded-lg p-4 space-y-2
              ${onRowClick ? 'cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all' : ''}
            `}
          >
            {mobileColumns.map((col, colIndex) => {
              const value = row[col.key];
              const displayValue = col.render ? col.render(value, row) : value;
              
              return (
                <div key={colIndex} className="flex justify-between items-start gap-2">
                  <span className="text-xs text-gray-600 font-medium">{col.label}:</span>
                  <span className="text-sm text-gray-900 font-semibold text-right flex-1">
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Desktop: Table view
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
            >
              {columns.map((col, colIndex) => {
                const value = row[col.key];
                const displayValue = col.render ? col.render(value, row) : value;
                
                return (
                  <td key={colIndex} className={`px-4 py-3 text-sm text-gray-900 ${col.className || ''}`}>
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
