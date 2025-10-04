import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface OrderUpdateRequest {
  orderId: string;
  action: 'accept' | 'prepare' | 'deliver' | 'complete' | 'cancel';
  supplierId?: string;
  estimatedDeliveryTime?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body: OrderUpdateRequest = await req.json();
      const { orderId, action, supplierId, estimatedDeliveryTime } = body;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, profiles!orders_client_id_fkey(*)')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      switch (action) {
        case 'accept':
          if (!supplierId) {
            return new Response(
              JSON.stringify({ error: 'Supplier ID required for acceptance' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: commissionSettings } = await supabase
            .from('commission_settings')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const orderTotal = order.total_amount - order.client_commission;
          const supplierCommission = commissionSettings 
            ? Math.round(orderTotal * (commissionSettings.supplier_commission_percentage / 100))
            : 0;
          const netSupplierAmount = orderTotal - supplierCommission;

          updateData = {
            ...updateData,
            status: 'accepted',
            supplier_id: supplierId,
            supplier_commission: supplierCommission,
            net_supplier_amount: netSupplierAmount,
            estimated_delivery_time: estimatedDeliveryTime || 45,
            accepted_at: new Date().toISOString(),
          };
          break;

        case 'prepare':
          updateData.status = 'preparing';
          break;

        case 'deliver':
          updateData.status = 'delivering';
          break;

        case 'complete':
          updateData = {
            ...updateData,
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          };
          break;

        case 'cancel':
          updateData.status = 'cancelled';
          break;

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: updatedOrder }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const userId = url.searchParams.get('userId');

      let query = supabase
        .from('orders')
        .select('*, profiles!orders_client_id_fkey(*), profiles!orders_supplier_id_fkey(*)');

      if (status) {
        query = query.eq('status', status);
      }

      if (userId) {
        query = query.or(`client_id.eq.${userId},supplier_id.eq.${userId}`);
      }

      const { data: orders, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ orders }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in order-management:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});