import React from 'react';

interface MemberStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

/**
 * Badge réutilisable pour afficher le statut d'un membre
 */
export const MemberStatusBadge: React.FC<MemberStatusBadgeProps> = ({ isActive, className = '' }) => {
  if (isActive) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}>
        <span className="w-1.5 h-1.5 mr-1.5 bg-green-600 rounded-full"></span>
        Actif
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ${className}`}>
      <span className="w-1.5 h-1.5 mr-1.5 bg-red-600 rounded-full"></span>
      Inactif
    </span>
  );
};
