import { supabase } from '../lib/supabase';

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
      .in('status', ['delivered', 'completed']);

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
      .in('status', ['delivered', 'completed']);

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
    return true;
  } catch (error) {
    console.error('Error creating rating:', error);
    return false;
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
