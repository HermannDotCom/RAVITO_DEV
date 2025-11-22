import { supabase } from '../lib/supabase';

export interface SupplierOfferItem {
  productId: string;
  quantity: number;
  withConsigne: boolean;
}

export interface SupplierOffer {
  id: string;
  orderId: string;
  supplierId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  modifiedItems: SupplierOfferItem[];
  totalAmount: number;
  consigneTotal: number;
  supplierCommission: number;
  netSupplierAmount: number;
  supplierMessage?: string;
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export async function createSupplierOffer(
  orderId: string,
  modifiedItems: SupplierOfferItem[],
  totalAmount: number,
  consigneTotal: number,
  supplierCommission: number,
  netSupplierAmount: number,
  supplierMessage?: string
): Promise<{ success: boolean; offerId?: string; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'Non authentifié' };
    }

    const { data: hasPendingRatings } = await supabase.rpc('has_pending_ratings', {
      user_id: userData.user.id
    });

    if (hasPendingRatings) {
      return {
        success: false,
        error: 'Vous devez d\'abord évaluer votre dernière transaction avant d\'accepter une nouvelle commande.'
      };
    }

    // Vérifier d'abord les conditions RLS manuellement pour un meilleur diagnostic
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('id, status, zone_id')
      .eq('id', orderId)
      .single();

    console.log('📋 Order check:', orderCheck);

    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id, role, is_approved')
      .eq('id', userData.user.id)
      .single();

    console.log('👤 Profile check:', profileCheck);

    const { data: zoneCheck } = await supabase
      .from('supplier_zones')
      .select('zone_id')
      .eq('supplier_id', userData.user.id)
      .eq('zone_id', orderCheck?.zone_id || '');

    console.log('📍 Zone check:', zoneCheck);

    const { data, error } = await supabase
      .from('supplier_offers')
      .insert({
        order_id: orderId,
        supplier_id: userData.user.id,
        modified_items: modifiedItems,
        total_amount: totalAmount,
        consigne_total: consigneTotal,
        supplier_commission: supplierCommission,
        net_supplier_amount: netSupplierAmount,
        supplier_message: supplierMessage
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating supplier offer:', error);
      console.error('📊 Diagnostic:', {
        orderId,
        orderStatus: orderCheck?.status,
        orderZone: orderCheck?.zone_id,
        supplierId: userData.user.id,
        supplierRole: profileCheck?.role,
        supplierApproved: profileCheck?.is_approved,
        supplierInZone: zoneCheck && zoneCheck.length > 0
      });
      return { success: false, error: error.message };
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'offers-received' })
      .eq('id', orderId)
      .eq('status', 'pending-offers');

    if (orderUpdateError) {
      console.error('Error updating order status:', orderUpdateError);
    }

    return { success: true, offerId: data.id };
  } catch (error) {
    console.error('Exception creating supplier offer:', error);
    return { success: false, error: 'Erreur lors de la création de l\'offre' };
  }
}

export async function getOffersByOrder(orderId: string): Promise<SupplierOffer[]> {
  try {
    // Fetch offers with supplier subscription info to enable tier-based sorting
    const { data, error } = await supabase
      .from('supplier_offers')
      .select(`
        *,
        supplier:profiles!supplier_id(
          id,
          name,
          business_name
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offers:', error);
      return [];
    }

    // Get active subscriptions for all suppliers to determine tier priority
    const supplierIds = data
      .map((offer: Record<string, unknown>) => offer.supplier_id)
      .filter((id): id is string => typeof id === 'string');
    const { data: subscriptions } = await supabase
      .from('supplier_subscriptions')
      .select(`
        supplier_id,
        tier:premium_tiers(name, display_order)
      `)
      .in('supplier_id', supplierIds)
      .eq('status', 'active');

    // Create a map of supplier tiers for fast lookup
    const supplierTiers = new Map<string, { tierName: string; displayOrder: number }>();
    subscriptions?.forEach((sub: Record<string, unknown>) => {
      const tier = sub.tier as Record<string, unknown>;
      supplierTiers.set(sub.supplier_id as string, {
        tierName: (tier?.name as string) || 'basic',
        displayOrder: (tier?.display_order as number) || 1
      });
    });

    // Map and sort offers: Gold tier first (highest display_order), then by creation date
    interface OfferWithTier extends SupplierOffer {
      _tierDisplayOrder: number;
      _tierName: string;
    }

    const mappedOffers: OfferWithTier[] = data.map((offer: Record<string, unknown>) => {
      const tier = supplierTiers.get(offer.supplier_id as string) || { tierName: 'basic', displayOrder: 1 };
      return {
        ...mapDatabaseOfferToApp(offer),
        _tierDisplayOrder: tier.displayOrder,
        _tierName: tier.tierName
      };
    });

    // Sort: Gold tier (display_order 3) first, then Silver (2), then Basic (1)
    // Within same tier, sort by creation date (newest first)
    mappedOffers.sort((a, b) => {
      if (b._tierDisplayOrder !== a._tierDisplayOrder) {
        return b._tierDisplayOrder - a._tierDisplayOrder;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Remove temporary sorting fields
    return mappedOffers.map(({ _tierDisplayOrder, _tierName, ...offer }) => offer as SupplierOffer);
  } catch (error) {
    console.error('Exception fetching offers:', error);
    return [];
  }
}

export async function getOffersBySupplier(supplierId: string): Promise<SupplierOffer[]> {
  try {
    const { data, error } = await supabase
      .from('supplier_offers')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching supplier offers:', error);
      return [];
    }

    return data.map(mapDatabaseOfferToApp);
  } catch (error) {
    console.error('Exception fetching supplier offers:', error);
    return [];
  }
}

export async function acceptOffer(
  offerId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'Non authentifié' };
    }

    const { data: hasPendingRatings } = await supabase.rpc('has_pending_ratings', {
      user_id: userData.user.id
    });

    if (hasPendingRatings) {
      return {
        success: false,
        error: 'Vous devez d\'abord évaluer votre dernière transaction avant de passer une nouvelle commande.'
      };
    }

    const { data: offers } = await supabase
      .from('supplier_offers')
      .select('*')
      .eq('order_id', orderId)
      .eq('id', offerId)
      .single();

    if (!offers) {
      return { success: false, error: 'Offre introuvable' };
    }

    const { error: rejectOthersError } = await supabase
      .from('supplier_offers')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .neq('id', offerId);

    if (rejectOthersError) {
      console.error('Error rejecting other offers:', rejectOthersError);
    }

    const { error: acceptError } = await supabase
      .from('supplier_offers')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (acceptError) {
      console.error('Error accepting offer:', acceptError);
      return { success: false, error: acceptError.message };
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'awaiting-payment',
        supplier_id: offers.supplier_id,
        total_amount: offers.total_amount,
        consigne_total: offers.consigne_total,
        supplier_commission: offers.supplier_commission,
        net_supplier_amount: offers.net_supplier_amount
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
      return { success: false, error: orderUpdateError.message };
    }

    const { error: itemsDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsDeleteError) {
      console.error('Error deleting old items:', itemsDeleteError);
    }

    const modifiedItems = offers.modified_items as SupplierOfferItem[];
    const itemsToInsert = modifiedItems.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      with_consigne: item.withConsigne
    }));

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsInsertError) {
      console.error('Error inserting new items:', itemsInsertError);
    }

    return { success: true };
  } catch (error) {
    console.error('Exception accepting offer:', error);
    return { success: false, error: 'Erreur lors de l\'acceptation de l\'offre' };
  }
}

export async function rejectOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('supplier_offers')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (error) {
      console.error('Error rejecting offer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception rejecting offer:', error);
    return { success: false, error: 'Erreur lors du refus de l\'offre' };
  }
}

function mapDatabaseOfferToApp(dbOffer: Record<string, unknown>): SupplierOffer {
  return {
    id: dbOffer.id as string,
    orderId: dbOffer.order_id as string,
    supplierId: dbOffer.supplier_id as string,
    status: dbOffer.status as 'pending' | 'accepted' | 'rejected',
    modifiedItems: dbOffer.modified_items as SupplierOfferItem[],
    totalAmount: dbOffer.total_amount as number,
    consigneTotal: dbOffer.consigne_total as number,
    supplierCommission: dbOffer.supplier_commission as number,
    netSupplierAmount: dbOffer.net_supplier_amount as number,
    supplierMessage: dbOffer.supplier_message as string | undefined,
    createdAt: new Date(dbOffer.created_at as string),
    acceptedAt: dbOffer.accepted_at ? new Date(dbOffer.accepted_at as string) : undefined,
    rejectedAt: dbOffer.rejected_at ? new Date(dbOffer.rejected_at as string) : undefined
  };
}
