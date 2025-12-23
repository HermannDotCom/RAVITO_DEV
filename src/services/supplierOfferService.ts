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
  supplierRating?: number;
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

    // Vérifier que la commande n'a pas déjà une offre acceptée
    const { data: acceptedOffer } = await supabase
      .from('supplier_offers')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (acceptedOffer) {
      return {
        success: false,
        error: 'Cette commande a déjà une offre acceptée. Vous ne pouvez plus soumettre d\'offre.'
      };
    }

    // Vérifier si ce fournisseur a déjà une offre en attente pour cette commande
    const { data: existingOffer } = await supabase
      .from('supplier_offers')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('supplier_id', userData.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    let data;
    let error;

    if (existingOffer) {
      // Mettre à jour l'offre existante
      const result = await supabase
        .from('supplier_offers')
        .update({
          modified_items: modifiedItems,
          total_amount: totalAmount,
          consigne_total: consigneTotal,
          supplier_commission: supplierCommission,
          net_supplier_amount: netSupplierAmount,
          supplier_message: supplierMessage,
          created_at: new Date().toISOString()
        })
        .eq('id', existingOffer.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Créer une nouvelle offre
      const result = await supabase
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

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error creating/updating supplier offer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, offerId: data.id };
  } catch (error) {
    console.error('Exception creating supplier offer:', error);
    return { success: false, error: 'Erreur lors de la création de l\'offre' };
  }
}

export async function getOffersByOrder(orderId: string): Promise<SupplierOffer[]> {
  try {
    // Ne récupérer que les offres en attente
    const { data, error } = await supabase
      .from('supplier_offers')
      .select(`
        *,
        supplier:profiles!supplier_id(
          id,
          name,
          business_name,
          rating
        )
      `)
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offers:', error);
      return [];
    }

    // Grouper par fournisseur et ne garder que l'offre la plus récente de chaque fournisseur
    const offersBySupplier = new Map<string, any>();
    data.forEach(offer => {
      const existing = offersBySupplier.get(offer.supplier_id);
      if (!existing || new Date(offer.created_at) > new Date(existing.created_at)) {
        offersBySupplier.set(offer.supplier_id, offer);
      }
    });

    return Array.from(offersBySupplier.values()).map(mapDatabaseOfferToApp);
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
  const supplier = dbOffer.supplier as { rating?: number } | null;
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
    supplierRating: supplier?.rating ?? undefined,
    createdAt: new Date(dbOffer.created_at as string),
    acceptedAt: dbOffer.accepted_at ? new Date(dbOffer.accepted_at as string) : undefined,
    rejectedAt: dbOffer.rejected_at ? new Date(dbOffer.rejected_at as string) : undefined
  };
}
