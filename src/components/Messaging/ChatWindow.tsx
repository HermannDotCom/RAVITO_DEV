/**
 * ChatWindow Component
 * Main modal interface for order messaging
 */

import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrderMessages } from '../../hooks/useOrderMessages';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { QuickMessages } from './QuickMessages';
import type { MessageSenderRole } from '../../types/messaging';
import type { Order } from '../../types';

interface ChatWindowProps {
  orderId: string;
  order?: Order;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: MessageSenderRole;
  orderNumber?: string;
}

export function ChatWindow({ 
  orderId, 
  order,
  isOpen, 
  onClose, 
  currentUserRole,
  orderNumber 
}: ChatWindowProps) {
  const { user } = useAuth();
  const {
    conversation,
    messages,
    isLoading,
    error,
    unreadCount,
    sendMessage,
    markAsRead
  } = useOrderMessages(orderId, currentUserRole);

  const [isSending, setIsSending] = useState(false);

  // Mark messages as read when window opens
  useEffect(() => {
    if (isOpen && conversation && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, conversation, unreadCount, markAsRead]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!conversation || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(content);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle quick message selection
  const handleQuickMessage = (content: string) => {
    handleSendMessage(content);
  };

  if (!isOpen) return null;

  // Get participant names for header
  const getHeaderTitle = () => {
    if (orderNumber) {
      return `Commande #${orderNumber}`;
    }
    return `Commande`;
  };

  const getSubtitle = () => {
    if (!conversation) return '';
    
    const roles = {
      client: 'Client',
      supplier: 'Fournisseur',
      driver: 'Livreur'
    };

    // Show who can participate
    if (currentUserRole === 'client') {
      return conversation.driver_id ? 'Client ↔ Fournisseur / Livreur' : 'Client ↔ Fournisseur';
    } else if (currentUserRole === 'supplier') {
      return 'Fournisseur ↔ Client';
    } else if (currentUserRole === 'driver') {
      return 'Livreur ↔ Client';
    }
    
    return '';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] 
                     flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                💬 {getHeaderTitle()}
              </h2>
              <p className="text-sm text-gray-600">{getSubtitle()}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* No conversation state */}
          {!isLoading && !conversation && !error && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Messagerie non disponible
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  La messagerie sera disponible une fois la commande payée
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {conversation && (
            <>
              <MessageList 
                messages={messages}
                currentUserId={user?.id || ''}
                isLoading={isLoading}
              />

              {/* Quick Messages */}
              {conversation.is_active && (
                <QuickMessages 
                  role={currentUserRole}
                  onSelect={handleQuickMessage}
                  disabled={isSending}
                />
              )}

              {/* Input */}
              {conversation.is_active ? (
                <MessageInput 
                  onSend={handleSendMessage}
                  disabled={isSending}
                />
              ) : (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Conversation fermée - Lecture seule
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
