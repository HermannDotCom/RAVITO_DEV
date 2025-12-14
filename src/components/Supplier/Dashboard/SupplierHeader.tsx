import React from 'react';
import { MapPin, Star, TrendingUp } from 'lucide-react';
import { getGreeting } from '../../../utils/greeting';

interface SupplierHeaderProps {
  supplierName: string;
  rating: number;
  zone?: string;
}

export const SupplierHeader: React.FC<SupplierHeaderProps> = ({ supplierName, rating, zone }) => {
  const { emoji, greeting, message } = getGreeting();

  const getRatingQuality = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' };
    if (rating >= 4.0) return { label: 'Très bien', color: 'bg-blue-50 border-blue-200 text-blue-900' };
    return { label: 'Bien', color: 'bg-amber-50 border-amber-200 text-amber-900' };
  };

  const ratingQuality = getRatingQuality(rating);

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 md:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full -mr-32 -mt-32 opacity-50" />
      <div className="relative">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{emoji}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {greeting}, {supplierName}
                </h1>
                <p className="text-slate-600 text-sm md:text-base mt-1">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {rating && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 border ${ratingQuality.color} rounded-full`}>
                <Star className="h-4 w-4 fill-current" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">Note</span>
                  <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-semibold">{ratingQuality.label}</span>
                </div>
              </div>
            )}
            {zone && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{zone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};