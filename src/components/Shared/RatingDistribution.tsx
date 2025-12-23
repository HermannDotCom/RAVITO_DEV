import React from 'react';
import { Star } from 'lucide-react';
import { RatingDistributionProps } from '../../types/rating';

export const RatingDistribution: React.FC<RatingDistributionProps> = ({ distribution, total }) => {
  const getPercentage = (count: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const renderBar = (stars: number, count: number) => {
    const percentage = getPercentage(count);

    return (
      <div key={stars} className="flex items-center space-x-3">
        {/* Star label */}
        <div className="flex items-center space-x-1 w-16">
          <span className="text-sm font-medium text-gray-700">{stars}</span>
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Percentage and count */}
        <div className="flex items-center space-x-2 w-24 justify-end">
          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
          <span className="text-xs text-gray-500">({count})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map(stars => renderBar(stars, distribution[stars as keyof typeof distribution]))}
    </div>
  );
};
