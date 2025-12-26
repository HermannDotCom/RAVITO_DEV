import React from 'react';
import type { TeamStats } from '../../types/team';

interface QuotaBarProps {
  stats: TeamStats;
}

/**
 * Display team member quota as a progress bar
 */
export const QuotaBar: React.FC<QuotaBarProps> = ({ stats }) => {
  const percentage = stats.maxMembers > 0 
    ? (stats.activeMembers / stats.maxMembers) * 100 
    : 0;

  // Determine color based on usage
  const getBarColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Quota de l'équipe</h3>
        <span className="text-sm font-semibold text-gray-900">
          {stats.activeMembers} / {stats.maxMembers}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{stats.pendingInvitations} invitation(s) en attente</span>
        <span>
          {stats.availableSlots > 0 
            ? `${stats.availableSlots} place(s) disponible(s)`
            : 'Quota atteint'}
        </span>
      </div>
    </div>
  );
};
