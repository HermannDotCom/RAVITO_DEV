/**
 * Plan Feature List Component
 * 
 * Displays a list of features with checkmarks or X marks
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import type { PlanFeature } from '../../types';

interface PlanFeatureListProps {
  features: PlanFeature[];
  className?: string;
}

export const PlanFeatureList: React.FC<PlanFeatureListProps> = ({ 
  features, 
  className = '' 
}) => {
  return (
    <ul className={`space-y-3 ${className}`}>
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-2">
          {feature.included ? (
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
            {feature.name}
          </span>
        </li>
      ))}
    </ul>
  );
};
