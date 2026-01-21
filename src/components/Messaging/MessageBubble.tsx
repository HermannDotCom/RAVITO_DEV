/**
 * MessageBubble Component
 * Displays an individual message in chat style (WhatsApp/iMessage)
 * With role-based colors for better readability
 */

import React from 'react';
import type { OrderMessage, MessageSenderRole } from '../../types/messaging';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: OrderMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderRole?: MessageSenderRole;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showAvatar = false,
  senderName,
  senderRole
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Couleur du nom selon le rôle
  const getRoleColor = (role?: MessageSenderRole) => {
    switch (role) {
      case 'client':
        return 'text-blue-600';
      case 'supplier':
        return 'text-orange-600';
      case 'driver':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  // Couleur de bulle selon le rôle
  const getBubbleColors = (role?:  MessageSenderRole, isOwn?:  boolean) => {
    if (isOwn) {
      // Mes messages - couleur vive selon mon rôle
      switch (role) {
        case 'client':
          return 'bg-blue-500 text-white';
        case 'supplier':
          return 'bg-orange-500 text-white';
        case 'driver': 
          return 'bg-green-500 text-white';
        default:
          return 'bg-orange-500 text-white';
      }
    } else {
      // Messages reçus - couleur claire selon le rôle de l'expéditeur
      switch (role) {
        case 'client':
          return 'bg-blue-100 text-blue-900';
        case 'supplier':
          return 'bg-orange-100 text-orange-900';
        case 'driver':
          return 'bg-green-100 text-green-900';
        default: 
          return 'bg-gray-200 text-gray-900';
      }
    }
  };

  // Couleur du timestamp et des indicateurs de lecture
  const getMetaColors = (role?: MessageSenderRole, isOwn?: boolean) => {
    if (isOwn) {
      return 'text-white/80';
    } else {
      switch (role) {
        case 'client':
          return 'text-blue-600/70';
        case 'supplier': 
          return 'text-orange-600/70';
        case 'driver':
          return 'text-green-600/70';
        default:
          return 'text-gray-500';
      }
    }
  };

  const bubbleClass = getBubbleColors(senderRole, isOwnMessage);
  const metaClass = getMetaColors(senderRole, isOwnMessage);
  const alignClass = isOwnMessage ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex ${alignClass} mb-3 px-4`}>
      <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender name with role color */}
        {senderName && (
          <div className={`text-xs font-medium mb-1 px-2 ${getRoleColor(senderRole)} ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {senderName}
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-2 ${bubbleClass} break-words`}>
          {/* System message styling */}
          {message.message_type === 'system' ?  (
            <div className="text-center italic text-sm">
              {message.content}
            </div>
          ) : (
            <div className="text-sm">
              {message.content}
            </div>
          )}
          
          {/* Time and read status */}
          <div className={`flex items-center gap-1 mt-1 text-xs ${metaClass} ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span>{formatTime(message.created_at)}</span>
            
            {/* Read indicators for own messages */}
            {isOwnMessage && (
              <span>
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}