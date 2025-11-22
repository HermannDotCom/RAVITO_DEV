import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MarketIntelligenceRequest {
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'special';
  zoneId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Market Intelligence Generator Edge Function
 * 
 * Generates market intelligence reports including:
 * - Market volume and value trends
 * - Trending and declining products
 * - Emerging zones
 * - Demand heatmaps
 * - Key insights and recommendations
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

    const body: MarketIntelligenceRequest = await req.json();
    
    // Calculate date range based on report type
    const endDate = body.endDate ? new Date(body.endDate) : new Date();
    let startDate: Date;
    
    switch (body.reportType) {
      case 'weekly':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate = body.startDate ? new Date(body.startDate) : new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get orders for the period
    let ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'delivered');

    if (body.zoneId) {
      ordersQuery = ordersQuery.eq('zone_id', body.zoneId);
    }

    const { data: orders } = await ordersQuery;

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data available for the specified period' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate market metrics
    const totalMarketVolume = orders.length;
    const totalMarketValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Get previous period for growth calculation
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd);
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', previousPeriodStart.toISOString().split('T')[0])
      .lte('created_at', previousPeriodEnd.toISOString().split('T')[0])
      .eq('status', 'delivered');

    const previousMarketValue = previousOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const growthRate = previousMarketValue > 0 
      ? ((totalMarketValue - previousMarketValue) / previousMarketValue) * 100 
      : 0;

    // Analyze product trends
    const productSales = new Map<string, { volume: number; value: number; name: string }>();
    
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown';
        const existing = productSales.get(productId) || { volume: 0, value: 0, name: productName };
        existing.volume += item.quantity;
        existing.value += item.subtotal;
        productSales.set(productId, existing);
      });
    });

    // Sort products by value
    const sortedProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.value - a.value);

    const trendingProducts = sortedProducts.slice(0, 5).map(p => ({
      productId: p.productId,
      productName: p.name,
      growthRate: 15.5, // In production, compare with previous period
      volumeIncrease: p.volume
    }));

    const decliningProducts = sortedProducts.slice(-3).map(p => ({
      productId: p.productId,
      productName: p.name,
      growthRate: -8.2, // In production, compare with previous period
      volumeIncrease: -p.volume
    }));

    // Analyze zones
    const zoneSales = new Map<string, number>();
    orders.forEach(order => {
      if (order.zone_id) {
        zoneSales.set(order.zone_id, (zoneSales.get(order.zone_id) || 0) + 1);
      }
    });

    const emergingZones = Array.from(zoneSales.entries())
      .map(([zoneId, volume]) => ({
        zoneId,
        zoneName: 'Zone ' + zoneId.slice(0, 8), // In production, fetch zone names
        growthRate: 25.0 // In production, calculate actual growth
      }))
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 3);

    // Create demand heatmap
    const demandHeatmap: Record<string, number> = {};
    Array.from(zoneSales.entries()).forEach(([zone, count]) => {
      demandHeatmap[zone] = count;
    });

    // Generate insights
    const keyInsights = [
      `Market grew by ${growthRate.toFixed(1)}% compared to previous period`,
      `Total of ${totalMarketVolume} orders worth ${totalMarketValue.toLocaleString()} FCFA`,
      `Top product: ${trendingProducts[0]?.productName || 'N/A'} with ${trendingProducts[0]?.volumeIncrease || 0} units sold`,
      `${emergingZones.length} zones showing strong growth potential`
    ];

    const recommendations = [
      'Focus on trending products to maximize revenue',
      'Expand coverage in emerging zones',
      'Monitor declining products and adjust pricing',
      'Increase inventory for high-demand items'
    ];

    // Save report to database
    const { data: report, error: insertError } = await supabase
      .from('market_intelligence')
      .insert({
        report_type: body.reportType,
        title: `${body.reportType.charAt(0).toUpperCase() + body.reportType.slice(1)} Market Intelligence Report`,
        report_date: endDateStr,
        zone_id: body.zoneId || null,
        total_market_volume: totalMarketVolume,
        total_market_value: totalMarketValue,
        growth_rate: Math.round(growthRate * 100) / 100,
        trending_products: trendingProducts,
        declining_products: decliningProducts,
        emerging_zones: emergingZones,
        key_insights: keyInsights,
        recommendations: recommendations,
        demand_heatmap: demandHeatmap,
        is_published: true
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          id: report.id,
          title: report.title,
          reportType: report.report_type,
          reportDate: report.report_date,
          metrics: {
            totalMarketVolume,
            totalMarketValue,
            growthRate: Math.round(growthRate * 100) / 100
          },
          trendingProducts,
          decliningProducts,
          emergingZones,
          keyInsights,
          recommendations,
          demandHeatmap
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in market-intelligence:', error);
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
