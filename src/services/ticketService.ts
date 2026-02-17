import { supabase } from '../lib/supabase';
import { executeWithRetry, SupabaseCallResult } from '../lib/supabaseWithRetry';
import { handleSupabaseError, AuthErrorResult } from './authErrorHandler';

export type TicketCategory = 'technical' | 'billing' | 'delivery' | 'account' | 'complaint' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  user_name?: string;
  user_email?: string;
  assigned_admin_name?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface CreateTicketData {
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_response: number;
  resolved: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

/**
 * Result type for createTicket with enhanced error handling
 */
export interface CreateTicketResult {
  success: boolean;
  ticket: SupportTicket | null;
  error: AuthErrorResult | null;
  shouldRefresh: boolean;
}

export const ticketService = {
  /**
   * Creates a new support ticket with enhanced error handling
   * Uses the retry mechanism for auth-related errors
   */
  async createTicket(userId: string, data: CreateTicketData): Promise<CreateTicketResult> {
    console.log('[ticketService] Creating ticket for user:', userId);
    
    const result = await executeWithRetry<SupportTicket>(
      async () => {
        return await supabase
          .from('support_tickets')
          .insert({
            user_id: userId,
            subject: data.subject,
            message: data.message,
            category: data.category,
            priority: data.priority,
            ticket_number: ''
          })
          .select()
          .single();
      },
      {
        maxRetries: 1,
        onRetry: (attempt, error) => {
          console.log(`[ticketService] Retrying createTicket (attempt ${attempt}):`, error.errorType);
        }
      }
    );

    if (result.success && result.data) {
      console.log('[ticketService] Ticket created successfully:', result.data.ticket_number);
      
      // Create notification (non-blocking, don't fail the whole operation)
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'ticket_created',
          title: 'Ticket créé',
          message: `Votre ticket ${result.data.ticket_number} a été créé avec succès.`,
          data: { ticket_id: result.data.id, ticket_number: result.data.ticket_number }
        });
      } catch (notifError) {
        console.warn('[ticketService] Failed to create notification:', notifError);
      }

      return {
        success: true,
        ticket: result.data,
        error: null,
        shouldRefresh: false
      };
    }

    console.error('[ticketService] Failed to create ticket:', result.error);
    return {
      success: false,
      ticket: null,
      error: result.error,
      shouldRefresh: result.shouldRefresh
    };
  },

  /**
   * Legacy createTicket method that returns SupportTicket | null
   * @deprecated Use createTicket instead which returns CreateTicketResult
   */
  async createTicketLegacy(userId: string, data: CreateTicketData): Promise<SupportTicket | null> {
    const result = await this.createTicket(userId, data);
    return result.ticket;
  },

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey(name, email),
          admin:profiles!support_tickets_assigned_to_fkey(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((ticket: any) => ({
        ...ticket,
        user_name: ticket.profiles?.name,
        user_email: ticket.profiles?.email,
        assigned_admin_name: ticket.admin?.name
      }));
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  },

  async getAllTickets(): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey(name, email, role),
          admin:profiles!support_tickets_assigned_to_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((ticket: any) => ({
        ...ticket,
        user_name: ticket.profiles?.name,
        user_email: ticket.profiles?.email,
        assigned_admin_name: ticket.admin?.name
      }));
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      return [];
    }
  },

  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey(name, email, role),
          admin:profiles!support_tickets_assigned_to_fkey(name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;

      return {
        ...data,
        user_name: data.profiles?.name,
        user_email: data.profiles?.email,
        assigned_admin_name: data.admin?.name
      };
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  },

  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    userId: string
  ): Promise<boolean> {
    try {
      const updateData: any = { status };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      const ticket = await this.getTicketById(ticketId);
      if (ticket) {
        await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          type: 'ticket_status_changed',
          title: 'Statut du ticket mis à jour',
          message: `Le statut de votre ticket ${ticket.ticket_number} a été mis à jour: ${this.getStatusLabel(status)}`,
          data: { ticket_id: ticketId, status }
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  },

  async assignTicket(ticketId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: adminId, status: 'in_progress' })
        .eq('id', ticketId);

      if (error) throw error;

      const ticket = await this.getTicketById(ticketId);
      if (ticket) {
        await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          type: 'ticket_assigned',
          title: 'Ticket assigné',
          message: `Votre ticket ${ticket.ticket_number} a été assigné à un administrateur.`,
          data: { ticket_id: ticketId }
        });
      }

      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  },

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          profiles(name, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        ...msg,
        user_name: msg.profiles?.name,
        user_role: msg.profiles?.role
      }));
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }
  },

  async addTicketMessage(
    ticketId: string,
    userId: string,
    message: string,
    isInternal: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          message,
          is_internal: isInternal
        });

      if (error) throw error;

      const ticket = await this.getTicketById(ticketId);
      if (ticket && !isInternal) {
        const recipientId = userId === ticket.user_id ? ticket.assigned_to : ticket.user_id;

        if (recipientId) {
          await supabase.from('notifications').insert({
            user_id: recipientId,
            type: 'ticket_message',
            title: 'Nouveau message',
            message: `Nouveau message sur le ticket ${ticket.ticket_number}`,
            data: { ticket_id: ticketId }
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding ticket message:', error);
      return false;
    }
  },

  async getTicketStats(): Promise<TicketStats> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority');

      if (error) throw error;

      const stats: TicketStats = {
        total: data?.length || 0,
        open: 0,
        in_progress: 0,
        waiting_response: 0,
        resolved: 0,
        closed: 0,
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      };

      data?.forEach((ticket: any) => {
        if (ticket.status === 'open') stats.open++;
        if (ticket.status === 'in_progress') stats.in_progress++;
        if (ticket.status === 'waiting_response') stats.waiting_response++;
        if (ticket.status === 'resolved') stats.resolved++;
        if (ticket.status === 'closed') stats.closed++;

        if (ticket.priority === 'low') stats.by_priority.low++;
        if (ticket.priority === 'medium') stats.by_priority.medium++;
        if (ticket.priority === 'high') stats.by_priority.high++;
        if (ticket.priority === 'urgent') stats.by_priority.urgent++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      return {
        total: 0,
        open: 0,
        in_progress: 0,
        waiting_response: 0,
        resolved: 0,
        closed: 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 }
      };
    }
  },

  /**
   * Admin creates a ticket on behalf of a user, with an initial admin message.
   * The ticket is created using the admin's session but assigned to the target user.
   */
  async adminCreateTicketForUser(
    targetUserId: string,
    subject: string,
    initialMessage: string,
    category: TicketCategory,
    priority: TicketPriority
  ): Promise<{ success: boolean; ticketNumber?: string; error?: string }> {
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        return { success: false, error: 'Session admin introuvable' };
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: targetUserId,
          subject,
          message: initialMessage,
          category,
          priority,
          status: 'waiting_response',
          assigned_to: adminUser.id,
          ticket_number: ''
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        console.error('[ticketService] adminCreateTicketForUser error:', ticketError);
        return { success: false, error: ticketError?.message || 'Erreur création ticket' };
      }

      const { error: msgError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: adminUser.id,
          message: initialMessage,
          is_internal: false
        });

      if (msgError) {
        console.warn('[ticketService] Failed to add initial message:', msgError);
      }

      try {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'ticket_created',
          title: 'Message de l\'administration',
          message: `Un message vous a été envoyé concernant votre demande d'inscription. Consultez votre support.`,
          data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number }
        });
      } catch (notifErr) {
        console.warn('[ticketService] Notification error:', notifErr);
      }

      return { success: true, ticketNumber: ticket.ticket_number };
    } catch (err: any) {
      console.error('[ticketService] adminCreateTicketForUser exception:', err);
      return { success: false, error: err?.message || 'Erreur inattendue' };
    }
  },

  getCategoryLabel(category: TicketCategory): string {
    const labels = {
      technical: 'Technique',
      billing: 'Facturation',
      delivery: 'Livraison',
      account: 'Compte',
      complaint: 'Réclamation',
      other: 'Autre'
    };
    return labels[category];
  },

  getPriorityLabel(priority: TicketPriority): string {
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente'
    };
    return labels[priority];
  },

  getStatusLabel(status: TicketStatus): string {
    const labels = {
      open: 'Ouvert',
      in_progress: 'En cours',
      waiting_response: 'En attente de réponse',
      resolved: 'Résolu',
      closed: 'Fermé'
    };
    return labels[status];
  },

  getPriorityColor(priority: TicketPriority): string {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[priority];
  },

  getStatusColor(status: TicketStatus): string {
    const colors = {
      open: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      waiting_response: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-gray-100 text-gray-700',
      closed: 'bg-gray-100 text-gray-500'
    };
    return colors[status];
  }
};
