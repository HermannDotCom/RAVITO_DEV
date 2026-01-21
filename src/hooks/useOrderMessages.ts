/**
 * useOrderMessages Hook
 * Manages real-time messaging for an order conversation
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { OrderConversation, OrderMessage, MessageSenderRole, MessageType } from '../types/messaging';
import * as messagingService from '../services/messagingService';

interface UseOrderMessagesReturn {
  conversation: OrderConversation | null;
  messages: OrderMessage[];
  participants: Record<string, { name: string; role: MessageSenderRole }>;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  sendMessage: (content: string, type?: MessageType) => Promise<void>;
  markAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing order messages with real-time updates
 */
export function useOrderMessages(orderId: string, senderRole: MessageSenderRole): UseOrderMessagesReturn {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<OrderConversation | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [participants, setParticipants] = useState<Record<string, { name: string; role: MessageSenderRole }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Load conversation and messages
   */
  const loadData = useCallback(async () => {
    if (!orderId || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get conversation
      const conv = await messagingService.getOrderConversation(orderId);
      
      if (!conv) {
        setConversation(null);
        setMessages([]);
        setParticipants({});
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      setConversation(conv);

      // Load participants
      await loadParticipants(conv);

      // Get messages
      const msgs = await messagingService.getConversationMessages(conv.id);
      setMessages(msgs);

      // Get unread count
      const unread = await messagingService.getUnreadCount(conv.id, user.id);
      setUnreadCount(unread);

    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user]);

  /**
   * Load participant profiles
   */
  const loadParticipants = async (conv: OrderConversation) => {
    const participantIds = [conv.client_id, conv.supplier_id, conv.driver_id].filter(Boolean);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, business_name')
      .in('id', participantIds);
    
    // For the driver, fetch organization name
    let orgName = '';
    if (conv.driver_id) {
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('organization:organizations(name)')
        .eq('user_id', conv.driver_id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (orgData?.organization?.name) {
        orgName = orgData.organization.name;
      }
    }
    
    const participantsMap: Record<string, { name: string; role: MessageSenderRole }> = {};
    
    profiles?.forEach(profile => {
      const displayName = profile.business_name || profile.name || 'Utilisateur';
      
      if (profile.id === conv.client_id) {
        participantsMap[profile.id] = { name: displayName, role: 'client' };
      } else if (profile.id === conv.supplier_id) {
        participantsMap[profile.id] = { name: displayName, role: 'supplier' };
      } else if (profile.id === conv.driver_id) {
        participantsMap[profile.id] = { 
          name: orgName ? `Livreur (${orgName})` : `Livreur (${displayName})`, 
          role: 'driver' 
        };
      }
    });
    
    setParticipants(participantsMap);
  };

  /**
   * Initial load
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Subscribe to real-time message updates
   */
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as OrderMessage;
          
          // Add message to list (avoid duplicates using Set for efficient lookup)
          setMessages(prev => {
            const messageIds = new Set(prev.map(m => m.id));
            if (messageIds.has(newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Update unread count if not our message
          if (user && newMessage.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
            
            // Optional: Play notification sound
            playNotificationSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const updatedMessage = payload.new as OrderMessage;
          
          // Update message in list
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, user]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string, type: MessageType = 'text') => {
    if (!conversation || !user) {
      throw new Error('Cannot send message: No conversation or user');
    }

    try {
      await messagingService.sendMessage(
        conversation.id,
        user.id,
        senderRole,
        content,
        type
      );
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [conversation, user, senderRole]);

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversation || !user) return;

    try {
      await messagingService.markMessagesAsRead(conversation.id, user.id);
      setUnreadCount(0);

      // Update local message state
      setMessages(prev =>
        prev.map(msg => 
          msg.sender_id !== user.id && !msg.is_read
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [conversation, user]);

  /**
   * Refresh conversation data
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    conversation,
    messages,
    participants,
    isLoading,
    error,
    unreadCount,
    sendMessage,
    markAsRead,
    refresh
  };
}

/**
 * Play notification sound for new messages
 */
function playNotificationSound() {
  try {
    // Use a simple beep sound (very short to keep file size small)
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhY' +
      'qFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N' +
      '2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eeeTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF60' +
      '6+uoVRQKRp/g8r5sIQUrgc7y2Yk3CBlou+3nnk0QDFC'
    );
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors (browser may block autoplay)
    });
  } catch (err) {
    // Ignore errors
  }
}
