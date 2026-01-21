/**
 * MessageBubble Component
 * Displays an individual message in chat style (WhatsApp/iMessage)
 */

import React from 'react';
import type { OrderMessage } from '../../types/messaging';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: OrderMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  senderName?: string;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showAvatar = false,
  senderName 
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const bubbleClass = isOwnMessage
    ? 'bg-orange-500 text-white ml-auto'
    : 'bg-gray-200 text-gray-900 mr-auto';

  const alignClass = isOwnMessage ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex ${alignClass} mb-3 px-4`}>
      <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender name (for group conversations or when needed) */}
        {!isOwnMessage && senderName && (
          <div className="text-xs text-gray-500 mb-1 px-2">
            {senderName}
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-2 ${bubbleClass} break-words`}>
          {/* System message styling */}
          {message.message_type === 'system' ? (
            <div className="text-center italic text-sm">
              {message.content}
            </div>
          ) : (
            <div className="text-sm">
              {message.content}
            </div>
          )}
          
          {/* Time and read status */}
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            isOwnMessage ? 'text-white/80 justify-end' : 'text-gray-500 justify-start'
          }`}>
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
