/**
 * Messaging Service
 * Handles all operations related to order conversations and messages
 */

import { supabase } from '../lib/supabase';
import type { OrderConversation, OrderMessage, MessageSenderRole, MessageType } from '../types/messaging';

/**
 * Get conversation for a specific order
 */
export async function getOrderConversation(orderId: string): Promise<OrderConversation | null> {
  try {
    const { data, error } = await supabase
      .from('order_conversations')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No conversation found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 100
): Promise<OrderMessage[]> {
  try {
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: MessageSenderRole,
  content: string,
  messageType: MessageType = 'text'
): Promise<OrderMessage> {
  try {
    const { data, error } = await supabase
      .from('order_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_role: senderRole,
        content,
        message_type: messageType
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Mark messages as read for current user
 */
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('order_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Get unread message count for a conversation
 */
export async function getUnreadCount(
  conversationId: string,
  currentUserId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('order_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Assign a driver to a conversation
 */
export async function assignDriverToConversation(
  orderId: string,
  driverId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('assign_driver_to_conversation', {
      p_order_id: orderId,
      p_driver_id: driverId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error assigning driver to conversation:', error);
    throw error;
  }
}

/**
 * Create a conversation manually (if not auto-created by trigger)
 */
export async function createConversation(
  orderId: string,
  clientId: string,
  supplierId: string
): Promise<OrderConversation> {
  try {
    const { data, error } = await supabase
      .from('order_conversations')
      .insert({
        order_id: orderId,
        client_id: clientId,
        supplier_id: supplierId
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Close a conversation (when order is completed)
 */
export async function closeConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('order_conversations')
      .update({
        is_active: false,
        closed_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error closing conversation:', error);
    throw error;
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<OrderConversation[]> {
  try {
    const { data, error } = await supabase
      .from('order_conversations')
      .select('*')
      .or(`client_id.eq.${userId},supplier_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
}
