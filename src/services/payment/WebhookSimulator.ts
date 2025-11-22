import { supabase } from '../../lib/supabase';

/**
 * Webhook Simulator
 * Simulates payment webhook callbacks from payment providers
 */
export class WebhookSimulator {
  private static webhookUrl = '/functions/v1/payment-webhook';

  /**
   * Simulate a payment webhook callback
   * In production, this would be called by the actual payment provider
   */
  static async simulateWebhook(
    orderId: string,
    transactionId: string,
    reference: string,
    status: 'success' | 'failed',
    amount: number,
    _paymentMethod: string
  ): Promise<void> {
    console.log('[WebhookSimulator] Simulating webhook callback', {
      orderId,
      transactionId,
      status,
      amount
    });

    try {
      // Simulate delay before webhook callback (realistic behavior)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real scenario, this would be an HTTP POST to the webhook URL
      // For now, we directly update the database as if webhook was received
      
      if (status === 'success') {
        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('[WebhookSimulator] Error updating order:', updateError);
          throw updateError;
        }

        // Get order details for notifications
        const { data: order } = await supabase
          .from('orders')
          .select('client_id, supplier_id')
          .eq('id', orderId)
          .single();

        // Send notifications
        const notifications = [];

        if (order?.client_id) {
          notifications.push(
            supabase.from('notifications').insert({
              user_id: order.client_id,
              type: 'payment_success',
              title: 'Paiement confirmé',
              message: `Votre paiement de ${amount} FCFA a été confirmé avec succès. Réf: ${reference}`,
              data: { orderId, transactionId, reference },
              created_at: new Date().toISOString()
            })
          );
        }

        if (order?.supplier_id) {
          notifications.push(
            supabase.from('notifications').insert({
              user_id: order.supplier_id,
              type: 'payment_received',
              title: 'Paiement reçu',
              message: `Le client a effectué le paiement de ${amount} FCFA. Réf: ${reference}`,
              data: { orderId, transactionId, reference },
              created_at: new Date().toISOString()
            })
          );
        }

        await Promise.all(notifications);

        console.log('[WebhookSimulator] Webhook processed successfully', { orderId, status: 'success' });
      } else {
        // Payment failed - update status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('[WebhookSimulator] Error updating order:', updateError);
          throw updateError;
        }

        // Get order details for notifications
        const { data: order } = await supabase
          .from('orders')
          .select('client_id')
          .eq('id', orderId)
          .single();

        // Notify client of failure
        if (order?.client_id) {
          await supabase.from('notifications').insert({
            user_id: order.client_id,
            type: 'payment_failed',
            title: 'Échec du paiement',
            message: `Le paiement de ${amount} FCFA a échoué. Veuillez réessayer. Réf: ${reference}`,
            data: { orderId, transactionId, reference },
            created_at: new Date().toISOString()
          });
        }

        console.log('[WebhookSimulator] Webhook processed with failure', { orderId, status: 'failed' });
      }
    } catch (error) {
      console.error('[WebhookSimulator] Error simulating webhook:', error);
      throw error;
    }
  }
}
