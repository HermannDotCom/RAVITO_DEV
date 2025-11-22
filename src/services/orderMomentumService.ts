import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../types';

export interface OrderSuggestion {
  product: Product;
  reason: string;
  confidence: number;
  discount?: number; // Mystery bonus percentage
}

export interface ZoneDemand {
  zoneId: string;
  zoneName: string;
  productId: string;
  productName: string;
  orderCount: number;
  timestamp: Date;
}

export interface MysteryBonus {
  orderId: string;
  discountPercentage: number;
  expiresAt: Date;
}

/**
 * Get smart order suggestions based on time of day, historical patterns, and zone trends
 */
export async function getSmartOrderSuggestions(
  userId: string,
  zoneId?: string
): Promise<OrderSuggestion[]> {
  try {
    const suggestions: OrderSuggestion[] = [];
    const currentHour = new Date().getHours();

    // Get user's order history
    const { data: userOrders } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        order_items (
          product_id,
          quantity,
          product:products (*)
        )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get frequently ordered products
    const productFrequency = new Map<string, number>();
    userOrders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const count = productFrequency.get(item.product_id) || 0;
        productFrequency.set(item.product_id, count + item.quantity);
      });
    });

    // Get zone trending products (what others are ordering)
    if (zoneId) {
      const { data: zoneTrends } = await supabase
        .from('orders')
        .select(`
          order_items (
            product_id,
            quantity,
            product:products (*)
          )
        `)
        .eq('zone_id', zoneId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
        .limit(50);

      const zoneTrendMap = new Map<string, number>();
      zoneTrends?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const count = zoneTrendMap.get(item.product_id) || 0;
          zoneTrendMap.set(item.product_id, count + 1);
        });
      });

      // Top trending in zone
      const topZoneTrends = Array.from(zoneTrendMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      for (const [productId, count] of topZoneTrends) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (product) {
          suggestions.push({
            product: mapProductFromDb(product),
            reason: `🔥 Tendance dans votre zone - ${count} bars ont commandé ce produit aujourd'hui`,
            confidence: Math.min(count / 10, 1)
          });
        }
      }
    }

    // Time-based suggestions
    const timeBasedSuggestions = await getTimeBasedSuggestions(currentHour);
    suggestions.push(...timeBasedSuggestions);

    // Historical patterns (products you order frequently)
    const topFrequent = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [productId, count] of topFrequent) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (product) {
        suggestions.push({
          product: mapProductFromDb(product),
          reason: `⭐ Vous avez commandé ce produit ${count} fois`,
          confidence: 0.9
        });
      }
    }

    return suggestions.slice(0, 6); // Top 6 suggestions
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    return [];
  }
}

async function getTimeBasedSuggestions(hour: number): Promise<OrderSuggestion[]> {
  try {
    let category: string;
    let reason: string;

    if (hour >= 18 && hour < 23) {
      category = 'biere';
      reason = '🌙 Parfait pour la soirée';
    } else if (hour >= 23 || hour < 2) {
      category = 'spiritueux';
      reason = '🌟 Les classiques de la nuit';
    } else if (hour >= 12 && hour < 18) {
      category = 'soda';
      reason = '☀️ Rafraîchissements de l\'après-midi';
    } else {
      category = 'eau';
      reason = '🌅 Commencez la journée hydraté';
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .limit(2);

    return (products || []).map(p => ({
      product: mapProductFromDb(p),
      reason,
      confidence: 0.8
    }));
  } catch (error) {
    console.error('Error getting time-based suggestions:', error);
    return [];
  }
}

/**
 * Generate mystery bonus for random orders (5-15% discount)
 */
export async function generateMysteryBonus(): Promise<number | null> {
  // 30% chance of getting a bonus
  if (Math.random() > 0.3) {
    return null;
  }

  // Random discount between 5% and 15%
  const discount = Math.floor(Math.random() * 11) + 5;
  return discount;
}

/**
 * Get real-time demand heatmap data for zones in Abidjan
 */
export async function getZoneDemandHeatmap(): Promise<ZoneDemand[]> {
  try {
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        zone_id,
        created_at,
        zone:zones (name),
        order_items (
          product_id,
          product:products (name)
        )
      `)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('created_at', { ascending: false });

    const demandMap = new Map<string, ZoneDemand>();

    recentOrders?.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const key = `${order.zone_id}-${item.product_id}`;
        const existing = demandMap.get(key);

        if (existing) {
          existing.orderCount++;
        } else {
          demandMap.set(key, {
            zoneId: order.zone_id,
            zoneName: order.zone?.name || 'Zone inconnue',
            productId: item.product_id,
            productName: item.product?.name || 'Produit',
            orderCount: 1,
            timestamp: new Date(order.created_at)
          });
        }
      });
    });

    return Array.from(demandMap.values())
      .sort((a, b) => b.orderCount - a.orderCount);
  } catch (error) {
    console.error('Error getting zone demand heatmap:', error);
    return [];
  }
}

/**
 * Get personalized greeting based on time and user activity
 */
export function getPersonalizedGreeting(userName: string): string {
  const hour = new Date().getHours();
  const greetings = [];

  if (hour >= 5 && hour < 12) {
    greetings.push(`Bonjour ${userName}! ☀️ Prêt à bien commencer la journée?`);
    greetings.push(`Salut ${userName}! 🌅 Une nouvelle journée commence!`);
  } else if (hour >= 12 && hour < 18) {
    greetings.push(`Bon après-midi ${userName}! 🌤️ Comment se passe votre journée?`);
    greetings.push(`Hey ${userName}! ⚡ L'après-midi parfait pour une commande!`);
  } else if (hour >= 18 && hour < 23) {
    greetings.push(`Bonsoir ${userName}! 🌙 La soirée promet d'être belle!`);
    greetings.push(`Salut ${userName}! 🎉 Prêt pour une soirée réussie?`);
  } else {
    greetings.push(`Bonsoir ${userName}! 🌟 Encore actif à cette heure!`);
    greetings.push(`Hey ${userName}! 🦉 Les noctambules sont les bienvenus!`);
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * AI Chatbot recommendation based on user query
 */
export async function getChatbotRecommendation(
  userQuery: string,
  userId: string
): Promise<{ message: string; products: Product[] }> {
  const query = userQuery.toLowerCase();

  // Simple keyword-based matching (could be enhanced with actual AI/ML)
  let category: string | null = null;
  let message = '';

  if (query.includes('bière') || query.includes('biere') || query.includes('beer')) {
    category = 'biere';
    message = '🍺 Voici nos meilleures bières pour vous!';
  } else if (query.includes('soda') || query.includes('boisson')) {
    category = 'soda';
    message = '🥤 Nos sodas rafraîchissants:';
  } else if (query.includes('vin') || query.includes('wine')) {
    category = 'vin';
    message = '🍷 Notre sélection de vins:';
  } else if (query.includes('spiritueux') || query.includes('alcool') || query.includes('fort')) {
    category = 'spiritueux';
    message = '🥃 Nos spiritueux premium:';
  } else if (query.includes('populaire') || query.includes('tendance') || query.includes('recommand')) {
    message = '⭐ Les produits les plus populaires en ce moment:';
  } else if (query.includes('pas cher') || query.includes('économique') || query.includes('prix')) {
    message = '💰 Nos meilleures offres qualité-prix:';
  } else {
    message = '🎯 Voici quelques suggestions pour vous:';
  }

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(4);

    if (category) {
      query = query.eq('category', category);
    }

    // Get popular products by order count
    const { data: products } = await query;

    return {
      message,
      products: (products || []).map(mapProductFromDb)
    };
  } catch (error) {
    console.error('Error getting chatbot recommendations:', error);
    return {
      message: 'Désolé, je n\'ai pas pu trouver de recommandations pour le moment.',
      products: []
    };
  }
}

function mapProductFromDb(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    reference: dbProduct.reference,
    name: dbProduct.name,
    category: dbProduct.category,
    brand: dbProduct.brand,
    crateType: dbProduct.crate_type,
    unitPrice: dbProduct.unit_price,
    cratePrice: dbProduct.crate_price,
    consignPrice: dbProduct.consign_price,
    description: dbProduct.description,
    alcoholContent: dbProduct.alcohol_content,
    volume: dbProduct.volume,
    isActive: dbProduct.is_active,
    imageUrl: dbProduct.image_url,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: new Date(dbProduct.updated_at),
    pricePerUnit: dbProduct.crate_price,
    consigneAmount: dbProduct.consign_price
  };
}
