/**
 * MessageList Component
 * Scrollable container for displaying messages
 */

import React, { useEffect, useRef } from 'react';
import type { OrderMessage, MessageSenderRole } from '../../types/messaging';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';

interface MessageListProps {
  messages: OrderMessage[];
  currentUserId: string;
  participants: Record<string, { name: string; role: MessageSenderRole }>;
  isLoading?: boolean;
}

export function MessageList({ messages, currentUserId, participants, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isLoading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-sm text-gray-600">Aucun message</p>
          <p className="text-xs text-gray-500 mt-1">Commencez la conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50 py-4"
      style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '300px' }}
    >
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserId;
        const participant = participants[message.sender_id];

        if (message.message_type === 'system') {
          return (
            <SystemMessage 
              key={message.id} 
              message={message} 
            />
          );
        }

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            senderName={participant?.name}
            senderRole={participant?.role || message.sender_role} // Fallback to message.sender_role from database
          />
        );
      })}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
