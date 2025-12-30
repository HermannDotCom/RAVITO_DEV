import React from 'react';
import type { MemberStatus } from '../../types/team';

interface MemberStatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

/**
 * Badge component to display member status with appropriate color
 */
export const MemberStatusBadge: React.FC<MemberStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusDisplay = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Actif',
          emoji: '🟢',
          colorClass: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'inactive':
        return {
          label: 'Inactif',
          emoji: '🔴',
          colorClass: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'pending':
        return {
          label: 'En attente',
          emoji: '🟡',
          colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      default:
        return {
          label: 'Inconnu',
          emoji: '⚪',
          colorClass: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const display = getStatusDisplay(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${display.colorClass} ${className}`}
    >
      <span className="mr-1">{display.emoji}</span>
      {display.label}
    </span>
  );
};
