import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentWebhookData {
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  timestamp: string;
  signature?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData: PaymentWebhookData = await req.json();
    const { orderId, paymentId, status, amount, paymentMethod, transactionId, timestamp } = webhookData;

    console.log('Payment webhook received:', { orderId, status, amount });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.total_amount !== amount) {
      console.error('Amount mismatch:', { expected: order.total_amount, received: amount });
      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status === 'success') {
      updateData = {
        ...updateData,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      };

      console.log('Payment successful for order:', orderId);

      const notificationPromises = [];

      if (order.client_id) {
        notificationPromises.push(
          supabase.from('notifications').insert({
            user_id: order.client_id,
            type: 'payment_success',
            title: 'Paiement confirmé',
            message: `Votre paiement de ${amount} FCFA a été confirmé avec succès.`,
            data: { orderId, transactionId },
          })
        );
      }

      if (order.supplier_id) {
        notificationPromises.push(
          supabase.from('notifications').insert({
            user_id: order.supplier_id,
            type: 'payment_received',
            title: 'Paiement reçu',
            message: `Le client a effectué le paiement de ${amount} FCFA.`,
            data: { orderId, transactionId },
          })
        );
      }

      await Promise.all(notificationPromises);
    } else if (status === 'failed') {
      updateData = {
        ...updateData,
        payment_status: 'pending',
      };

      console.log('Payment failed for order:', orderId);

      if (order.client_id) {
        await supabase.from('notifications').insert({
          user_id: order.client_id,
          type: 'payment_failed',
          title: 'Échec du paiement',
          message: `Le paiement de ${amount} FCFA a échoué. Veuillez réessayer.`,
          data: { orderId, transactionId },
        });
      }
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order updated successfully:', orderId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment webhook processed successfully',
        order: updatedOrder 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in payment-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});