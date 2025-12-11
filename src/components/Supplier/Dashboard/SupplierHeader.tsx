import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { getGreeting } from '../../../utils/greeting';

interface SupplierHeaderProps {
  supplierName: string;
  rating: number;
  zone?: string;
}

export const SupplierHeader: React.FC<SupplierHeaderProps> = ({ supplierName, rating, zone }) => {
  const { emoji, greeting, message } = getGreeting();

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {emoji} {greeting}, {supplierName} !
          </h1>
          <p className="text-sm text-slate-600">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {rating && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-900">{rating.toFixed(1)}</span>
            </div>
          )}
          {zone && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{zone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
