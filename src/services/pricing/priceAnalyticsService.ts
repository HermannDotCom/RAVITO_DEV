/**
 * Service de calcul et analyse des données tarifaires
 * Fournit des statistiques et intelligence de marché
 */

import { supabase } from '../../lib/supabase';

export interface PriceAnalytics {
  id: string;
  productId: string;
  zoneId?: string;
  periodStart: Date;
  periodEnd: Date;
  referencePriceAvg: number;
  supplierPriceMin: number;
  supplierPriceMax: number;
  supplierPriceAvg: number;
  supplierPriceMedian: number;
  avgVariancePercentage: number;
  maxVariancePercentage: number;
  totalOrders: number;
  totalQuantity: number;
  totalSuppliers: number;
  calculatedAt: Date;
  isCurrent: boolean;
}

export interface PriceVarianceAnalysis {
  productId: string;
  productName: string;
  referencePrice: number;
  supplierPrices: {
    supplierId: string;
    supplierName: string;
    price: number;
    variance: number;
    variancePercentage: number;
  }[];
  avgVariance: number;
  minPrice: number;
  maxPrice: number;
}

export interface MarketPriceTrend {
  productId: string;
  productName: string;
  periods: {
    date: Date;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    orderCount: number;
  }[];
}

/**
 * Récupère les analytics de prix pour un produit/zone
 */
export async function getPriceAnalytics(
  productId?: string,
  zoneId?: string,
  isCurrent: boolean = true
): Promise<PriceAnalytics[]> {
  try {
    let query = supabase
      .from('price_analytics')
      .select('*')
      .order('period_start', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }
    if (isCurrent) {
      query = query.eq('is_current', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching price analytics:', error);
      throw error;
    }

    return (data || []).map(mapPriceAnalyticsFromDb);
  } catch (error) {
    console.error('Exception in getPriceAnalytics:', error);
    throw error;
  }
}

/**
 * Calcule l'analyse de variance des prix pour un produit
 */
export async function calculatePriceVariance(
  productId: string,
  zoneId?: string
): Promise<PriceVarianceAnalysis | null> {
  try {
    // Récupérer le prix de référence
    const { data: refPriceData, error: refError } = await supabase
      .from('reference_prices')
      .select('reference_crate_price, products(name)')
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();

    if (refError) {
      console.error('Error fetching reference price:', refError);
      throw refError;
    }

    if (!refPriceData) {
      return null;
    }

    const referencePrice = refPriceData.reference_crate_price;
    const productName = (refPriceData.products as any)?.name || '';

    // Récupérer les prix des fournisseurs
    let supplierQuery = supabase
      .from('supplier_price_grids')
      .select('supplier_id, crate_price, profiles(name, business_name)')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (zoneId) {
      supplierQuery = supplierQuery.eq('zone_id', zoneId);
    }

    const { data: supplierPrices, error: supplierError } = await supplierQuery;

    if (supplierError) {
      console.error('Error fetching supplier prices:', supplierError);
      throw supplierError;
    }

    if (!supplierPrices || supplierPrices.length === 0) {
      return {
        productId,
        productName,
        referencePrice,
        supplierPrices: [],
        avgVariance: 0,
        minPrice: referencePrice,
        maxPrice: referencePrice,
      };
    }

    // Calculer les variances
    const supplierPricesWithVariance = supplierPrices.map(sp => {
      const variance = sp.crate_price - referencePrice;
      const variancePercentage = ((variance / referencePrice) * 100);
      const profile = sp.profiles as any;
      
      return {
        supplierId: sp.supplier_id,
        supplierName: profile?.business_name || profile?.name || 'Unknown',
        price: sp.crate_price,
        variance,
        variancePercentage,
      };
    });

    const prices = supplierPricesWithVariance.map(sp => sp.price);
    const variances = supplierPricesWithVariance.map(sp => sp.variance);
    
    return {
      productId,
      productName,
      referencePrice,
      supplierPrices: supplierPricesWithVariance,
      avgVariance: variances.reduce((sum, v) => sum + v, 0) / variances.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  } catch (error) {
    console.error('Exception in calculatePriceVariance:', error);
    throw error;
  }
}

/**
 * Récupère les tendances de prix pour un produit sur une période
 */
export async function getPriceTrends(
  productId: string,
  startDate: Date,
  endDate: Date,
  zoneId?: string
): Promise<MarketPriceTrend | null> {
  try {
    // Récupérer le nom du produit
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw productError;
    }

    // Récupérer les snapshots de prix des commandes
    let snapshotQuery = supabase
      .from('order_pricing_snapshot')
      .select('applied_crate_price, created_at, orders(created_at)')
      .eq('product_id', productId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: snapshots, error: snapshotError } = await snapshotQuery;

    if (snapshotError) {
      console.error('Error fetching price snapshots:', snapshotError);
      throw snapshotError;
    }

    if (!snapshots || snapshots.length === 0) {
      return {
        productId,
        productName: productData.name,
        periods: [],
      };
    }

    // Grouper par jour et calculer les statistiques
    const periodMap = new Map<string, {
      prices: number[];
      orderCount: number;
    }>();

    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!periodMap.has(dateKey)) {
        periodMap.set(dateKey, { prices: [], orderCount: 0 });
      }
      
      const period = periodMap.get(dateKey)!;
      period.prices.push(snapshot.applied_crate_price);
      period.orderCount++;
    });

    // Convertir en tableau trié
    const periods = Array.from(periodMap.entries())
      .map(([dateStr, data]) => {
        const prices = data.prices.sort((a, b) => a - b);
        return {
          date: new Date(dateStr),
          avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
          minPrice: prices[0],
          maxPrice: prices[prices.length - 1],
          orderCount: data.orderCount,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      productId,
      productName: productData.name,
      periods,
    };
  } catch (error) {
    console.error('Exception in getPriceTrends:', error);
    throw error;
  }
}

/**
 * Génère un rapport de prix pour tous les produits
 */
export async function generatePriceReport(
  zoneId?: string
): Promise<{
  totalProducts: number;
  withReferencePrices: number;
  withSupplierPrices: number;
  avgVariance: number;
  productsAboveReference: number;
  productsBelowReference: number;
}> {
  try {
    // Compter les produits actifs
    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) throw countError;

    // Compter les produits avec prix de référence
    let refQuery = supabase
      .from('reference_prices')
      .select('product_id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (zoneId) {
      refQuery = refQuery.eq('zone_id', zoneId);
    }

    const { count: withReferencePrices, error: refCountError } = await refQuery;

    if (refCountError) throw refCountError;

    // Compter les produits avec grilles fournisseur
    let supplierQuery = supabase
      .from('supplier_price_grids')
      .select('product_id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (zoneId) {
      supplierQuery = supplierQuery.eq('zone_id', zoneId);
    }

    const { count: withSupplierPrices, error: supplierCountError } = await supplierQuery;

    if (supplierCountError) throw supplierCountError;

    // Récupérer les analytics actuelles
    const analytics = await getPriceAnalytics(undefined, zoneId, true);
    
    const avgVariance = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.avgVariancePercentage, 0) / analytics.length
      : 0;

    const productsAboveReference = analytics.filter(a => a.avgVariancePercentage > 0).length;
    const productsBelowReference = analytics.filter(a => a.avgVariancePercentage < 0).length;

    return {
      totalProducts: totalProducts || 0,
      withReferencePrices: withReferencePrices || 0,
      withSupplierPrices: withSupplierPrices || 0,
      avgVariance,
      productsAboveReference,
      productsBelowReference,
    };
  } catch (error) {
    console.error('Exception in generatePriceReport:', error);
    throw error;
  }
}

/**
 * Crée ou met à jour une entrée d'analytics
 */
export async function upsertPriceAnalytics(
  productId: string,
  zoneId: string | undefined,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  try {
    // Calculer les statistiques basées sur les snapshots de commandes
    let snapshotQuery = supabase
      .from('order_pricing_snapshot')
      .select('reference_crate_price, applied_crate_price, orders(supplier_id)')
      .eq('product_id', productId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const { data: snapshots, error: snapshotError } = await snapshotQuery;

    if (snapshotError) throw snapshotError;

    if (!snapshots || snapshots.length === 0) {
      return; // Pas de données pour cette période
    }

    const appliedPrices = snapshots.map(s => s.applied_crate_price).sort((a, b) => a - b);
    const referencePrices = snapshots
      .map(s => s.reference_crate_price)
      .filter(p => p !== null) as number[];
    
    const uniqueSuppliers = new Set(
      snapshots.map(s => (s.orders as any)?.supplier_id).filter(Boolean)
    );

    const variances = snapshots
      .filter(s => s.reference_crate_price)
      .map(s => ((s.applied_crate_price - s.reference_crate_price!) / s.reference_crate_price!) * 100);

    const median = appliedPrices[Math.floor(appliedPrices.length / 2)];

    // Marquer les anciennes analytics comme non-current
    await supabase
      .from('price_analytics')
      .update({ is_current: false })
      .eq('product_id', productId)
      .eq('is_current', true);

    // Insérer nouvelles analytics
    const { error: insertError } = await supabase
      .from('price_analytics')
      .insert({
        product_id: productId,
        zone_id: zoneId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        reference_price_avg: referencePrices.length > 0
          ? Math.round(referencePrices.reduce((sum, p) => sum + p, 0) / referencePrices.length)
          : null,
        supplier_price_min: appliedPrices[0],
        supplier_price_max: appliedPrices[appliedPrices.length - 1],
        supplier_price_avg: Math.round(appliedPrices.reduce((sum, p) => sum + p, 0) / appliedPrices.length),
        supplier_price_median: median,
        avg_variance_percentage: variances.length > 0
          ? variances.reduce((sum, v) => sum + v, 0) / variances.length
          : 0,
        max_variance_percentage: variances.length > 0
          ? Math.max(...variances.map(Math.abs))
          : 0,
        total_orders: snapshots.length,
        total_quantity: snapshots.length, // Simplification, à améliorer avec vraies quantités
        total_suppliers: uniqueSuppliers.size,
        is_current: true,
      });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Exception in upsertPriceAnalytics:', error);
    throw error;
  }
}

/**
 * Map database row to PriceAnalytics
 */
function mapPriceAnalyticsFromDb(data: any): PriceAnalytics {
  return {
    id: data.id,
    productId: data.product_id,
    zoneId: data.zone_id,
    periodStart: new Date(data.period_start),
    periodEnd: new Date(data.period_end),
    referencePriceAvg: data.reference_price_avg,
    supplierPriceMin: data.supplier_price_min,
    supplierPriceMax: data.supplier_price_max,
    supplierPriceAvg: data.supplier_price_avg,
    supplierPriceMedian: data.supplier_price_median,
    avgVariancePercentage: data.avg_variance_percentage,
    maxVariancePercentage: data.max_variance_percentage,
    totalOrders: data.total_orders,
    totalQuantity: data.total_quantity,
    totalSuppliers: data.total_suppliers,
    calculatedAt: new Date(data.calculated_at),
    isCurrent: data.is_current,
  };
}
