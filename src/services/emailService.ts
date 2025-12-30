import { supabase } from '../lib/supabase';

const APP_URL = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://ravito.ci');

export type EmailType = 'welcome' | 'welcome_member' | 'password_reset' | 'new_order' | 'delivery_confirmation' | 'order_paid' | 'offer_received' | 'offer_accepted' | 'delivery_code' | 'order_cancelled' | 'rating_request';

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
        dashboardUrl: `${APP_URL}/dashboard`,
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
        dashboardUrl: `${APP_URL}/supplier/orders`,
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
        ratingUrl: `${APP_URL}/orders/${params.orderId}/rate`,
      },
    });
  },

  async sendOrderPaidEmail(params: {
    to: string;
    clientName: string;
    clientEmail: string;
    orderId: string;
    supplierName: string;
    supplierPhone?: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; unit: string }>;
    deliveryAddress: string;
  }) {
    return this.send({
      type: 'order_paid',
      to: params.to,
      data: params,
    });
  },

  async sendOfferReceivedEmail(params: {
    to: string;
    clientName: string;
    clientEmail: string;
    orderId: string;
    supplierName: string;
    supplierRating?: number;
    offerAmount: number;
    estimatedDeliveryTime?: number;
    supplierMessage?: string;
  }) {
    return this.send({
      type: 'offer_received',
      to: params.to,
      data: {
        ...params,
        offerUrl: `${APP_URL}/orders`,
      },
    });
  },

  async sendOfferAcceptedEmail(params: {
    to: string;
    supplierName: string;
    supplierEmail: string;
    orderId: string;
    clientName: string;
    clientPhone?: string;
    deliveryAddress: string;
    items: Array<{ name: string; quantity: number; unit: string }>;
    totalAmount: number;
  }) {
    return this.send({
      type: 'offer_accepted',
      to: params.to,
      data: {
        ...params,
        dashboardUrl: `${APP_URL}/supplier/orders`,
      },
    });
  },

  async sendDeliveryCodeEmail(params: {
    to: string;
    clientName: string;
    clientEmail: string;
    orderId: string;
    deliveryCode: string;
    supplierName: string;
  }) {
    return this.send({
      type: 'delivery_code',
      to: params.to,
      data: params,
    });
  },

  async sendOrderCancelledEmail(params: {
    to: string;
    recipientName: string;
    recipientEmail: string;
    orderId: string;
    cancellationReason?: string;
    refundAmount?: number;
    isClient: boolean;
  }) {
    return this.send({
      type: 'order_cancelled',
      to: params.to,
      data: params,
    });
  },

  async sendRatingRequestEmail(params: {
    to: string;
    clientName: string;
    clientEmail: string;
    orderId: string;
    supplierName: string;
  }) {
    return this.send({
      type: 'rating_request',
      to: params.to,
      data: {
        ...params,
        ratingUrl: `${APP_URL}/orders/${params.orderId}/rate`,
      },
    });
  },

  async sendWelcomeMemberEmail(params: {
    to: string;
    memberName: string;
    organizationName: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.send({
      type: 'welcome_member',
      to: params.to,
      data: {
        memberName: params.memberName,
        organizationName: params.organizationName,
        email: params.email,
        password: params.password,
        role: params.role,
        loginUrl: `${APP_URL}/login`,
      },
    });
  },
};
