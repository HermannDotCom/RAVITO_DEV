/**
 * In-App Messaging System Types
 * Defines interfaces for order-based conversations between clients, suppliers, and drivers
 */

export type MessageSenderRole = 'client' | 'supplier' | 'driver';
export type MessageType = 'text' | 'quick' | 'system';

/**
 * Represents a conversation linked to a specific order
 */
export interface OrderConversation {
  id: string;
  order_id: string;
  client_id: string;
  supplier_id: string;
  driver_id: string | null;
  is_active: boolean;
  created_at: string;
  closed_at: string | null;
}

/**
 * Represents an individual message within a conversation
 */
export interface OrderMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: MessageSenderRole;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Pre-defined quick reply message
 */
export interface QuickMessage {
  id: string;
  label: string;
  content: string;
  icon?: string;
}

/**
 * Quick messages organized by user role
 */
export const QUICK_MESSAGES: Record<MessageSenderRole, QuickMessage[]> = {
  client: [
    { id: 'ok', label: 'OK', content: 'OK' },
    { id: 'thanks', label: 'Merci', content: 'Merci' },
    { id: 'on_way', label: 'En route', content: 'Je suis en route' },
    { id: 'arrive_10', label: '10 min', content: "J'arrive dans 10 min" },
    { id: 'arrive_30', label: '30 min', content: "J'arrive dans 30 min" },
    { id: 'where', label: 'Où êtes-vous ?', content: 'Où êtes-vous ?' },
    { id: 'call', label: 'Appelez-moi', content: 'Appelez-moi svp' }
  ],
  supplier: [
    { id: 'ready', label: 'Prête ✅', content: 'Commande prête ✅' },
    { id: 'preparing', label: 'En préparation', content: 'En préparation' },
    { id: 'driver_route', label: 'Livreur en route', content: 'Livreur en route' },
    { id: 'pickup', label: 'Venir chercher ?', content: 'Pouvez-vous passer chercher ?' },
    { id: 'reminder', label: 'Rappel', content: 'Rappel: commande prête' }
  ],
  driver: [
    { id: 'on_route', label: 'En route 🚚', content: 'En route 🚚' },
    { id: 'arrive_5', label: '5 min', content: "J'arrive dans 5 min" },
    { id: 'arrive_10', label: '10 min', content: "J'arrive dans 10 min" },
    { id: 'arrived', label: 'Arrivé 📍', content: 'Je suis arrivé 📍' },
    { id: 'where_exactly', label: 'Où exactement ?', content: 'Où êtes-vous exactement ?' },
    { id: 'come_out', label: 'Sortez svp', content: 'Pouvez-vous sortir svp ?' },
    { id: 'waiting', label: "J'attends", content: "Je vous attends dehors" }
  ]
};
