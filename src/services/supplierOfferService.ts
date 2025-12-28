import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

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

interface AcceptOfferResponse {
  success: boolean;
  error?: string;
  message?: string;
  offer_id?: string;
  order_id?: string;
  supplier_id?: string;
  total_amount?: number;
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

    // Send email to client about new offer
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          profiles!orders_client_id_fkey(full_name, email),
          supplier:profiles!orders_supplier_id_fkey(business_name, rating)
        `)
        .eq('id', orderId)
        .single();

      if (orderData && orderData.profiles?.email) {
        await emailService.sendOfferReceivedEmail({
          to: orderData.profiles.email,
          clientName: orderData.profiles.full_name || 'Client',
          clientEmail: orderData.profiles.email,
          orderId: orderId,
          supplierName: orderData.supplier?.business_name || 'Fournisseur',
          supplierRating: orderData.supplier?.rating,
          offerAmount: totalAmount,
          supplierMessage: supplierMessage,
        });
      }
    } catch (emailError) {
      console.error('Failed to send offer received email:', emailError);
      // Non-blocking - offer creation succeeded
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

    // Call the atomic SQL function
    const { data, error } = await supabase.rpc('accept_supplier_offer', {
      p_offer_id: offerId,
      p_order_id: orderId
    });

    if (error) {
      console.error('Error calling accept_supplier_offer:', error);
      return { success: false, error: error.message };
    }

    // Validate and parse the response
    if (!data || typeof data !== 'object') {
      console.error('Invalid response from accept_supplier_offer:', data);
      return { success: false, error: 'Réponse invalide du serveur' };
    }

    const result = data as AcceptOfferResponse;
    
    if (!result.success) {
      console.error('accept_supplier_offer failed:', result.error);
      return { success: false, error: result.error || 'Erreur lors de l\'acceptation de l\'offre' };
    }

    // Send email to supplier about accepted offer (non-blocking)
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_address,
          total_amount,
          profiles!orders_client_id_fkey(full_name, phone),
          supplier:profiles!orders_supplier_id_fkey(email, business_name),
          order_items(
            quantity,
            product:products(name, crate_type)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderData && orderData.supplier?.email) {
        const items = (orderData.order_items || []).map((item: any) => ({
          name: item.product?.name || 'Produit',
          quantity: item.quantity,
          unit: item.product?.crate_type || 'unité',
        }));

        await emailService.sendOfferAcceptedEmail({
          to: orderData.supplier.email,
          supplierName: orderData.supplier.business_name || 'Fournisseur',
          supplierEmail: orderData.supplier.email,
          orderId: orderId,
          clientName: orderData.profiles?.full_name || 'Client',
          clientPhone: orderData.profiles?.phone,
          deliveryAddress: orderData.delivery_address,
          items,
          totalAmount: orderData.total_amount,
        });
      }
    } catch (emailError) {
      console.error('Failed to send offer accepted email:', emailError);
      // Non-blocking - offer acceptance succeeded
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

export interface SupplierPriceGrid {
  product_id: string;
  unit_price: number;
  crate_price: number;
  consign_price: number;
}

/**
 * Fetches supplier's custom prices from supplier_price_grids table
 * Returns a Map for quick lookup by product_id
 * 
 * @param supplierId - The UUID of the supplier
 * @returns Map with product_id as key and SupplierPriceGrid as value
 *          Returns empty Map if no custom prices found or on error
 * 
 * Error Handling:
 * - Database errors are logged and empty Map is returned
 * - Exceptions are caught and empty Map is returned
 * - Allows graceful fallback to reference prices
 */
export async function getSupplierPrices(
  supplierId: string
): Promise<Map<string, SupplierPriceGrid>> {
  try {
    const { data: supplierGrids, error } = await supabase
      .from('supplier_price_grids')
      .select('product_id, unit_price, crate_price, consign_price')
      .eq('supplier_id', supplierId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching supplier prices:', error);
      return new Map();
    }

    const priceMap = new Map<string, SupplierPriceGrid>();
    supplierGrids?.forEach(grid => {
      priceMap.set(grid.product_id, grid);
    });

    return priceMap;
  } catch (error) {
    console.error('Exception fetching supplier prices:', error);
    return new Map();
  }
}
