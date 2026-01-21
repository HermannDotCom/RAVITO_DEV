/**
 * SystemMessage Component
 * Displays system notifications in the conversation
 */

import React from 'react';
import type { OrderMessage } from '../../types/messaging';
import { Lock, Unlock } from 'lucide-react';

interface SystemMessageProps {
  message: OrderMessage;
}

export function SystemMessage({ message }: SystemMessageProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Determine icon based on message content
  const getIcon = () => {
    if (message.content.includes('ouverte') || message.content.includes('Conversation ouverte')) {
      return <Unlock className="w-4 h-4" />;
    }
    if (message.content.includes('fermée') || message.content.includes('Conversation fermée')) {
      return <Lock className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="flex justify-center mb-4 px-4">
      <div className="bg-gray-300/50 text-gray-700 text-xs px-4 py-2 rounded-full flex items-center gap-2">
        {getIcon()}
        <span>{message.content}</span>
        <span className="text-gray-500">• {formatTime(message.created_at)}</span>
      </div>
    </div>
  );
}
