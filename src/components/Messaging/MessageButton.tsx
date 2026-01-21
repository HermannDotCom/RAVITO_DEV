/**
 * MessageButton Component
 * Button with unread badge to open chat
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface MessageButtonProps {
  orderId: string;
  unreadCount?: number;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MessageButton({ 
  orderId, 
  unreadCount = 0, 
  onClick, 
  disabled = false,
  size = 'md'
}: MessageButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative ${sizeClasses[size]} bg-orange-500 text-white rounded-full
                 hover:bg-orange-600 transition-colors shadow-md
                 disabled:bg-gray-300 disabled:cursor-not-allowed`}
      aria-label={`Ouvrir la messagerie${unreadCount > 0 ? ` (${unreadCount} non lus)` : ''}`}
      title="Messagerie"
    >
      <MessageCircle className={iconSizes[size]} />
      
      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                         rounded-full min-w-[18px] h-[18px] flex items-center justify-center
                         px-1 font-semibold animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
