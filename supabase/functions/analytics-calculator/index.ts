import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalyticsCalculationRequest {
  supplierId?: string; // If not provided, calculate for all suppliers
  date?: string; // ISO date string, defaults to yesterday
}

/**
 * Analytics Calculator Edge Function
 * 
 * Calculates daily analytics for suppliers including:
 * - Order metrics (acceptance rate, completion rate)
 * - Revenue metrics (gross, net, average order value)
 * - Performance metrics (delivery time, customer satisfaction)
 * - Customer metrics (unique, repeat, new, churn)
 */
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

    // Verify authorization
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

    // Check if user is admin or system
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: AnalyticsCalculationRequest = req.method === 'POST' ? await req.json() : {};
    
    // Calculate date range (default to yesterday)
    const targetDate = body.date ? new Date(body.date) : new Date(Date.now() - 86400000);
    const dateStr = targetDate.toISOString().split('T')[0];
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    // Get suppliers to calculate for
    let supplierIds: string[] = [];
    if (body.supplierId) {
      supplierIds = [body.supplierId];
    } else {
      const { data: suppliers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'supplier')
        .eq('is_approved', true);
      
      supplierIds = suppliers?.map(s => s.id) || [];
    }

    const results = [];

    // Calculate analytics for each supplier
    for (const supplierId of supplierIds) {
      try {
        // Get orders for the day
        const { data: orders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('supplier_id', supplierId)
          .gte('created_at', dateStr)
          .lt('created_at', nextDayStr);

        if (!orders || orders.length === 0) {
          continue;
        }

        // Calculate metrics
        const totalOrders = orders.length;
        const acceptedOrders = orders.filter(o => 
          ['accepted', 'preparing', 'delivering', 'delivered'].includes(o.status)
        ).length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        
        const acceptanceRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 0;
        
        const grossRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const netRevenue = orders.reduce((sum, o) => 
          sum + ((o.total_amount || 0) - (o.supplier_commission || 0)), 0
        );
        const averageOrderValue = completedOrders > 0 ? grossRevenue / completedOrders : 0;

        // Calculate delivery times
        const deliveredOrders = orders.filter(o => 
          o.status === 'delivered' && o.delivered_at && o.accepted_at
        );
        const deliveryTimes = deliveredOrders.map(o => {
          const accepted = new Date(o.accepted_at).getTime();
          const delivered = new Date(o.delivered_at).getTime();
          return (delivered - accepted) / 60000; // Convert to minutes
        });
        const averageDeliveryTime = deliveryTimes.length > 0
          ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
          : null;

        // Get ratings for the day
        const { data: ratings } = await supabase
          .from('ratings')
          .select('overall')
          .eq('to_user_id', supplierId)
          .gte('created_at', dateStr)
          .lt('created_at', nextDayStr);

        const customerSatisfaction = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length
          : null;

        // Get unique customers
        const uniqueCustomers = new Set(orders.map(o => o.client_id)).size;

        // Get zones served
        const zonesServed = [...new Set(orders.map(o => o.zone_id).filter(Boolean))];

        // Upsert analytics
        const { error: upsertError } = await supabase
          .from('supplier_analytics')
          .upsert({
            supplier_id: supplierId,
            date: dateStr,
            total_orders: totalOrders,
            accepted_orders: acceptedOrders,
            completed_orders: completedOrders,
            cancelled_orders: cancelledOrders,
            acceptance_rate: Math.round(acceptanceRate * 100) / 100,
            gross_revenue: grossRevenue,
            net_revenue: netRevenue,
            average_order_value: Math.round(averageOrderValue),
            average_delivery_time: averageDeliveryTime ? Math.round(averageDeliveryTime) : null,
            customer_satisfaction: customerSatisfaction,
            unique_customers: uniqueCustomers,
            zones_served: zonesServed,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'supplier_id,date'
          });

        if (upsertError) {
          console.error(`Error upserting analytics for supplier ${supplierId}:`, upsertError);
        } else {
          results.push({
            supplierId,
            date: dateStr,
            metrics: {
              totalOrders,
              acceptanceRate: Math.round(acceptanceRate * 100) / 100,
              grossRevenue,
              averageDeliveryTime: averageDeliveryTime ? Math.round(averageDeliveryTime) : null
            }
          });
        }
      } catch (error) {
        console.error(`Error calculating analytics for supplier ${supplierId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: dateStr,
        suppliersProcessed: results.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analytics-calculator:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
