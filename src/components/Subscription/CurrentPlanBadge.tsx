/**
 * Current Plan Badge Component
 * 
 * Displays a badge showing the current subscription plan
 */

import React from 'react';
import { Crown, Award, Target, Zap } from 'lucide-react';
import type { PlanType } from '../../types';

interface CurrentPlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const planConfig = {
  FREE: {
    label: 'Free',
    icon: Target,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300'
  },
  SILVER: {
    label: 'Silver',
    icon: Award,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300'
  },
  GOLD: {
    label: 'Gold',
    icon: Crown,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400'
  },
  PLATINUM: {
    label: 'Platinum',
    icon: Zap,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-400'
  }
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export const CurrentPlanBadge: React.FC<CurrentPlanBadgeProps> = ({
  plan,
  size = 'md',
  showIcon = true
}) => {
  const config = planConfig[plan];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};
