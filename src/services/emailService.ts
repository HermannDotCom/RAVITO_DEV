import { supabase } from '../lib/supabase';

export type EmailType = 'welcome' | 'password_reset' | 'new_order' | 'delivery_confirmation';

interface SendEmailParams {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

export const emailService = {
  async send({ type, to, data }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: { type, to, data },
      });

      if (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: result.id };
    } catch (err) {
      console.error('Email service error:', err);
      return { success: false, error: (err as Error).message };
    }
  },

  async sendWelcomeEmail(params: {
    to: string;
    userName: string;
    userEmail: string;
    role: 'client' | 'supplier';
    businessName?: string;
  }) {
    return this.send({
      type: 'welcome',
      to: params.to,
      data: {
        userName: params.userName,
        userEmail: params.userEmail,
        role: params.role,
        businessName: params.businessName,
        dashboardUrl: `${window.location.origin}/dashboard`,
      },
    });
  },

  async sendPasswordResetEmail(params: {
    to: string;
    userName?: string;
    resetUrl: string;
  }) {
    return this.send({
      type: 'password_reset',
      to: params.to,
      data: {
        userName: params.userName,
        resetUrl: params.resetUrl,
        expirationMinutes: 60,
      },
    });
  },

  async sendNewOrderEmail(params: {
    to: string;
    supplierName: string;
    orderId: string;
    clientName: string;
    clientZone: string;
    items: Array<{ name: string; quantity: number; unit: string }>;
    totalAmount: number;
  }) {
    return this.send({
      type: 'new_order',
      to: params.to,
      data: {
        ...params,
        dashboardUrl: `${window.location.origin}/supplier/orders`,
      },
    });
  },

  async sendDeliveryConfirmationEmail(params: {
    to: string;
    clientName: string;
    orderId: string;
    supplierName: string;
    deliveryTime: string;
    totalAmount: number;
  }) {
    return this.send({
      type: 'delivery_confirmation',
      to: params.to,
      data: {
        ...params,
        ratingUrl: `${window.location.origin}/orders/${params.orderId}/rate`,
      },
    });
  },
};
