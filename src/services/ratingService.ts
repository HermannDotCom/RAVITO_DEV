import { supabase } from '../lib/supabase';
import { RatingDetails, RatingDistribution, Review } from '../types/rating';

export interface Rating {
  id: string;
  order_id: string;
  from_user_id: string;
  to_user_id: string;
  from_user_role: 'client' | 'supplier' | 'admin';
  to_user_role: 'client' | 'supplier' | 'admin';
  punctuality: number;
  quality: number;
  communication: number;
  overall: number;
  comment: string | null;
  created_at: string;
  from_user?: {
    name: string;
    business_name?: string;
  };
}

export interface SupplierStats {
  totalDeliveries: number;
  averageRating: number;
  averageDeliveryTime: number;
  successRate: number;
  recentRatings: Rating[];
}

export const getSupplierStats = async (supplierId: string): Promise<SupplierStats> => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, estimated_delivery_time, delivered_at, accepted_at')
      .eq('supplier_id', supplierId)
      .in('status', ['delivered']);

    if (ordersError) throw ordersError;

    const totalDeliveries = orders?.length || 0;

    const completedOrders = orders?.filter(o => o.delivered_at && o.accepted_at) || [];
    const averageDeliveryTime = completedOrders.length > 0
      ? Math.round(
          completedOrders.reduce((sum, order) => {
            const deliveryTime = new Date(order.delivered_at).getTime() - new Date(order.accepted_at).getTime();
            return sum + (deliveryTime / (1000 * 60));
          }, 0) / completedOrders.length
        )
      : 0;

    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select(`
        *,
        profiles!ratings_from_user_id_fkey (
          name,
          business_name
        )
      `)
      .eq('to_user_id', supplierId)
      .eq('to_user_role', 'supplier')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ratingsError) throw ratingsError;

    const mappedRatings: Rating[] = (ratings || []).map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      from_user_id: r.from_user_id,
      to_user_id: r.to_user_id,
      from_user_role: r.from_user_role,
      to_user_role: r.to_user_role,
      punctuality: r.punctuality,
      quality: r.quality,
      communication: r.communication,
      overall: parseFloat(r.overall),
      comment: r.comment,
      created_at: r.created_at,
      from_user: {
        name: r.profiles?.name || 'Utilisateur',
        business_name: r.profiles?.business_name
      }
    }));

    const averageRating = mappedRatings.length > 0
      ? mappedRatings.reduce((sum, r) => sum + r.overall, 0) / mappedRatings.length
      : 0;

    const successRate = totalDeliveries > 0 ? 100 : 0;

    return {
      totalDeliveries,
      averageRating: Math.round(averageRating * 10) / 10,
      averageDeliveryTime,
      successRate,
      recentRatings: mappedRatings.slice(0, 3)
    };
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    return {
      totalDeliveries: 0,
      averageRating: 0,
      averageDeliveryTime: 0,
      successRate: 0,
      recentRatings: []
    };
  }
};

export const getClientStats = async (clientId: string): Promise<SupplierStats> => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('client_id', clientId)
      .in('status', ['delivered']);

    if (ordersError) throw ordersError;

    const totalOrders = orders?.length || 0;

    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select(`
        *,
        profiles!ratings_from_user_id_fkey (
          name,
          business_name
        )
      `)
      .eq('to_user_id', clientId)
      .eq('to_user_role', 'client')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ratingsError) throw ratingsError;

    const mappedRatings: Rating[] = (ratings || []).map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      from_user_id: r.from_user_id,
      to_user_id: r.to_user_id,
      from_user_role: r.from_user_role,
      to_user_role: r.to_user_role,
      punctuality: r.punctuality,
      quality: r.quality,
      communication: r.communication,
      overall: parseFloat(r.overall),
      comment: r.comment,
      created_at: r.created_at,
      from_user: {
        name: r.profiles?.name || 'Fournisseur',
        business_name: r.profiles?.business_name
      }
    }));

    const averageRating = mappedRatings.length > 0
      ? mappedRatings.reduce((sum, r) => sum + r.overall, 0) / mappedRatings.length
      : 0;

    return {
      totalDeliveries: totalOrders,
      averageRating: Math.round(averageRating * 10) / 10,
      averageDeliveryTime: 0,
      successRate: 100,
      recentRatings: mappedRatings.slice(0, 3)
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return {
      totalDeliveries: 0,
      averageRating: 0,
      averageDeliveryTime: 0,
      successRate: 0,
      recentRatings: []
    };
  }
};

export const createRating = async (ratingData: {
  orderId: string;
  fromUserId: string;
  toUserId: string;
  fromUserRole: 'client' | 'supplier';
  toUserRole: 'client' | 'supplier';
  punctuality: number;
  quality: number;
  communication: number;
  comment?: string;
}): Promise<boolean> => {
  try {
    const overall = (ratingData.punctuality + ratingData.quality + ratingData.communication) / 3;

    const { error } = await supabase
      .from('ratings')
      .insert([{
        order_id: ratingData.orderId,
        from_user_id: ratingData.fromUserId,
        to_user_id: ratingData.toUserId,
        from_user_role: ratingData.fromUserRole,
        to_user_role: ratingData.toUserRole,
        punctuality: ratingData.punctuality,
        quality: ratingData.quality,
        communication: ratingData.communication,
        overall: overall,
        comment: ratingData.comment || null
      }]);

    if (error) throw error;

    console.log('Rating created successfully');

    // Check if both parties have rated and send notifications
    await checkAndUpdateOrderToCompleted(ratingData.orderId);

    return true;
  } catch (error) {
    console.error('Error creating rating:', error);
    return false;
  }
};

/**
 * Check if both client and supplier have rated the order
 * If yes, send notifications to both parties
 */
export const checkAndUpdateOrderToCompleted = async (orderId: string): Promise<boolean> => {
  try {
    // Get all ratings for this order
    const { data: allRatings, error: ratingsError } = await supabase
      .from('ratings')
      .select('from_user_role')
      .eq('order_id', orderId);

    if (ratingsError) {
      console.error('Error fetching ratings for completion check:', ratingsError);
      return false;
    }

    const hasClientRating = allRatings?.some(r => r.from_user_role === 'client');
    const hasSupplierRating = allRatings?.some(r => r.from_user_role === 'supplier');

    if (hasClientRating && hasSupplierRating) {
      console.log(`Order ${orderId} - both parties have rated`);

      // Create notifications for both parties
      const { data: orderData } = await supabase
        .from('orders')
        .select('client_id, supplier_id')
        .eq('id', orderId)
        .single();

      if (orderData) {
        // Notify both parties that ratings are now visible
        const notifications = [];
        
        if (orderData.client_id) {
          notifications.push({
            user_id: orderData.client_id,
            title: 'Évaluations disponibles',
            message: 'Les évaluations mutuelles de votre commande sont maintenant visibles.',
            type: 'rating',
            data: { orderId }
          });
        }
        
        if (orderData.supplier_id) {
          notifications.push({
            user_id: orderData.supplier_id,
            title: 'Évaluations disponibles',
            message: 'Les évaluations mutuelles de votre livraison sont maintenant visibles.',
            type: 'rating',
            data: { orderId }
          });
        }

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in checkAndUpdateOrderToCompleted:', error);
    return false;
  }
};

/**
 * Get both ratings for an order (client's and supplier's)
 */
export const getOrderMutualRatings = async (orderId: string): Promise<{
  clientRating: Rating | null;
  supplierRating: Rating | null;
  bothCompleted: boolean;
}> => {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        from_profile:profiles!ratings_from_user_id_fkey (
          name,
          business_name
        )
      `)
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching mutual ratings:', error);
      return { clientRating: null, supplierRating: null, bothCompleted: false };
    }

    const clientRatingData = ratings?.find(r => r.from_user_role === 'client');
    const supplierRatingData = ratings?.find(r => r.from_user_role === 'supplier');

    const mapRating = (r: any): Rating | null => {
      if (!r) return null;
      return {
        id: r.id,
        order_id: r.order_id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        from_user_role: r.from_user_role,
        to_user_role: r.to_user_role,
        punctuality: r.punctuality,
        quality: r.quality,
        communication: r.communication,
        overall: parseFloat(r.overall),
        comment: r.comment,
        created_at: r.created_at,
        from_user: r.from_profile ? {
          name: r.from_profile.name || 'Utilisateur',
          business_name: r.from_profile.business_name
        } : undefined
      };
    };

    return {
      clientRating: mapRating(clientRatingData),
      supplierRating: mapRating(supplierRatingData),
      bothCompleted: !!(clientRatingData && supplierRatingData)
    };
  } catch (error) {
    console.error('Error in getOrderMutualRatings:', error);
    return { clientRating: null, supplierRating: null, bothCompleted: false };
  }
};

export const hasUserRatedOrder = async (orderId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('id')
      .eq('order_id', orderId)
      .eq('from_user_id', userId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking if user rated order:', error);
    return false;
  }
};

/**
 * Get detailed rating statistics for a user
 */
export const getRatingDetails = async (
  userId: string,
  userType: 'client' | 'supplier'
): Promise<RatingDetails | null> => {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('overall, punctuality, quality, communication')
      .eq('to_user_id', userId)
      .eq('to_user_role', userType);

    if (error) throw error;

    if (!ratings || ratings.length === 0) {
      return {
        userId,
        userType,
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    // Calculate average rating
    const averageRating = ratings.reduce((sum, r) => sum + parseFloat(r.overall.toString()), 0) / ratings.length;

    // Calculate distribution
    const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      const roundedRating = Math.round(parseFloat(r.overall.toString())) as 1 | 2 | 3 | 4 | 5;
      distribution[roundedRating]++;
    });

    return {
      userId,
      userType,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: ratings.length,
      distribution
    };
  } catch (error) {
    console.error('Error fetching rating details:', error);
    return null;
  }
};

/**
 * Get paginated reviews for a user
 */
export const getReviews = async (
  userId: string,
  userType: 'client' | 'supplier',
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: Review[]; hasMore: boolean }> => {
  try {
    const offset = (page - 1) * limit;
    
    // Fetch limit + 1 to check if there are more records
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('id, overall, comment, created_at, from_user_role')
      .eq('to_user_id', userId)
      .eq('to_user_role', userType)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit); // Fetch one extra to check for more

    if (error) throw error;

    const reviews: Review[] = (ratings || []).slice(0, limit).map(r => ({
      id: r.id,
      rating: parseFloat(r.overall.toString()),
      comment: r.comment,
      createdAt: r.created_at,
      reviewerType: r.from_user_role as 'client' | 'supplier'
    }));

    return {
      reviews,
      hasMore: ratings ? ratings.length > limit : false
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], hasMore: false };
  }
};

/**
 * Calculate rating distribution for a user
 */
export const getRatingDistribution = async (
  userId: string,
  userType: 'client' | 'supplier'
): Promise<RatingDistribution> => {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('overall')
      .eq('to_user_id', userId)
      .eq('to_user_role', userType);

    if (error) throw error;

    const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    (ratings || []).forEach(r => {
      const roundedRating = Math.round(parseFloat(r.overall.toString())) as 1 | 2 | 3 | 4 | 5;
      distribution[roundedRating]++;
    });

    return distribution;
  } catch (error) {
    console.error('Error calculating rating distribution:', error);
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }
};
