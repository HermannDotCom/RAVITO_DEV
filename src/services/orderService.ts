import { supabase } from '../lib/supabase';
import { selectBestSupplierAndCost } from './yangoService';
import { isNightTime } from '../utils/timeUtils';
import { Order, OrderStatus, CartItem, PaymentMethod } from '../types';

export async function createOrder(
  clientId: string,
  items: CartItem[],
  deliveryAddress: string,
  coordinates: { lat: number; lng: number },
  paymentMethod: PaymentMethod,
  commissionSettings: { clientCommission: number; supplierCommission: number },
  zoneId?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    if (!zoneId) {
      return { success: false, error: 'Zone de livraison non spécifiée.' };
    }

    // 1. Sélectionner le meilleur fournisseur et calculer le coût de livraison Yango
    const bestSupplierResult = await selectBestSupplierAndCost(coordinates, zoneId);

    if (!bestSupplierResult) {
      return { success: false, error: 'Aucun fournisseur disponible pour cette zone et cette heure.' };
    }

    const { supplierId, deliveryCost } = bestSupplierResult;
    
    // Le coût de livraison Yango inclut déjà la marge RAVITO (15%)
    const ravitoMargin = Math.round(deliveryCost / (1 + 0.15) * 0.15); // Calcul inverse pour retrouver la marge

    const subtotal = items.reduce((sum, item) => sum + (item.product.cratePrice * item.quantity), 0);
    const consigneTotal = items.reduce(
      (sum, item) => sum + (item.withConsigne ? item.product.consignPrice * item.quantity : 0),
      0
    );

    const orderTotal = subtotal + consigneTotal;
    const clientCommission = Math.round(orderTotal * (commissionSettings.clientCommission / 100));
    
    // Le montant total inclut le coût de la commande, la commission client et le coût de livraison
    const totalAmount = orderTotal + clientCommission + deliveryCost;

    const orderData: any = {
      client_id: clientId,
      supplier_id: supplierId, // Fournisseur pré-sélectionné
      status: 'accepted', // La commande est directement acceptée par le fournisseur sélectionné
      total_amount: totalAmount,
      consigne_total: consigneTotal,
      client_commission: clientCommission,
      supplier_commission: 0,
      net_supplier_amount: 0,
      delivery_address: deliveryAddress,
      coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
      payment_method: paymentMethod,
      payment_status: 'pending',
      zone_id: zoneId,
      delivery_cost: deliveryCost, // Nouveau champ
      ravito_margin: ravitoMargin // Nouveau champ
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
      
    // Mise à jour du statut pour les commandes acceptées (pour ne pas apparaître dans pending-offers)
    // Note: Le statut 'accepted' est mis directement dans orderData, cette étape est redondante mais peut être utile
    // pour des triggers Supabase.
    if (order && order.status === 'accepted') {
      await supabase.from('supplier_offers').insert([{
        order_id: order.id,
        supplier_id: supplierId,
        status: 'accepted',
        offer_amount: order.total_amount // Montant total de la commande
      }]);
    }

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { success: false, error: orderError.message };
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      with_consigne: item.withConsigne,
      unit_price: item.product.unitPrice,
      crate_price: item.product.cratePrice,
      consign_price: item.product.consignPrice,
      subtotal: item.product.cratePrice * item.quantity + (item.withConsigne ? item.product.consignPrice * item.quantity : 0)
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return { success: false, error: itemsError.message };
    }

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Exception creating order:', error);
    return { success: false, error: 'Erreur lors de la création de la commande' };
  }
}

export async function getOrdersByClient(clientId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders_with_coords')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        zone:zones (name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map(mapDatabaseOrderToApp);
  } catch (error) {
    console.error('Exception fetching orders:', error);
    return [];
  }
}

export async function getPendingOrders(supplierId?: string, isClientSearch: boolean = false): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders_with_coords')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        zone:zones (name)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map(mapDatabaseOrderToApp);
  } catch (error) {
    console.error('Exception fetching orders:', error);
    return [];
  }
}

export async function getPendingOrders(supplierId?: string, isClientSearch: boolean = false): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders_with_coords')
      .select(`
        *,
        client:profiles!client_id(
          id,
          rating
        ),
        order_items (
          *,
          product:products (*)
        ),
        zone:zones (name)
      `)
      .in('status', ['pending-offers', 'offers-received']);

    // -------------------------------------------------------------------
    // LOGIQUE DE GARDE DE NUIT
    // -------------------------------------------------------------------
    if (isClientSearch && isNightTime()) {
      console.log('🌙 Mode Garde de Nuit activé pour la recherche client.');
      
      // 1. Récupérer les fournisseurs en garde de nuit pour aujourd'hui
      const { data: nightGuardSuppliers, error: ngError } = await supabase
        .from('night_guard_schedule')
        .select('supplier_id, covered_zones')
        .eq('is_active', true)
        .eq('date', new Date().toISOString().split('T')[0]); // Aujourd'hui

      if (ngError) {
        console.error('❌ Erreur lors de la récupération des plannings de garde de nuit:', ngError);
        // Continuer sans filtre si erreur
      } else if (nightGuardSuppliers && nightGuardSuppliers.length > 0) {
        const nightGuardIds = nightGuardSuppliers.map(ng => ng.supplier_id);
        const coveredZoneIds = nightGuardSuppliers.flatMap(ng => ng.covered_zones);

        // 2. Filtrer les commandes pour qu'elles correspondent aux zones couvertes par la garde
        query = query.in('zone_id', coveredZoneIds);
        
        // 3. Filtrer les offres pour qu'elles ne soient visibles que par les fournisseurs de garde
        // (Ceci est géré par la RLS sur la table night_guard_schedule)
        
        console.log(`✅ ${nightGuardIds.length} fournisseurs en garde de nuit trouvés.`);
      } else {
        console.log('⚠️ Aucun fournisseur en garde de nuit trouvé. La recherche sera vide.');
        // Si aucun fournisseur en garde, on retourne un jeu de données vide pour le client
        return [];
      }
    }
    // -------------------------------------------------------------------
    // FIN LOGIQUE DE GARDE DE NUIT
    // -------------------------------------------------------------------

    if (supplierId) {
      console.log('🔍 Fetching zones for supplier:', supplierId);

      const { data: supplierZones, error: zonesError } = await supabase
        .from('supplier_zones')
        .select('zone_id')
        .eq('supplier_id', supplierId)
        .eq('approval_status', 'approved');

      if (zonesError) {
        console.error('❌ Error fetching supplier zones:', zonesError);
        return [];
      }

      console.log('✅ Supplier zones found:', supplierZones);
      const zoneIds = supplierZones.map(sz => sz.zone_id);
      console.log('📍 Zone IDs to filter by:', zoneIds);

      if (zoneIds.length === 0) {
        console.warn('⚠️ No approved zones found for this supplier');
        return [];
      }

      query = query.in('zone_id', zoneIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching pending orders:', error);
      return [];
    }

    console.log('📦 getPendingOrders - Raw data from DB:', JSON.stringify(data, null, 2));
    console.log('📦 Number of orders:', data?.length);
    if (data && data.length > 0) {
      console.log('📦 First order details:');
      console.log('  - ID:', data[0].id);
      console.log('  - zone_id:', data[0].zone_id);
      console.log('  - status:', data[0].status);
      console.log('  - order_items:', data[0].order_items);
      console.log('  - order_items count:', data[0].order_items?.length);
    } else {
      console.warn('⚠️ No orders returned from query');
    }

    // Si on filtre pour un fournisseur, exclure les commandes avec une offre acceptée
    let orders = data.map(mapDatabaseOrderToApp);

    if (supplierId) {
      const { data: acceptedOffers } = await supabase
        .from('supplier_offers')
        .select('order_id')
        .eq('status', 'accepted');

      const acceptedOrderIds = new Set(acceptedOffers?.map(o => o.order_id) || []);
      orders = orders.filter(order => !acceptedOrderIds.has(order.id));
    }

    return orders;
  } catch (error) {
    console.error('Exception fetching pending orders:', error);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders_with_coords')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        zone:zones (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }

    return data.map(mapDatabaseOrderToApp);
  } catch (error) {
    console.error('Exception fetching all orders:', error);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updates?: Partial<{
    supplierId: string;
    estimatedDeliveryTime: number;
    acceptedAt: Date;
    deliveredAt: Date;
  }>
): Promise<boolean> {
  try {
    const updateData: any = { status };

    if (updates?.supplierId) {
      updateData.supplier_id = updates.supplierId;
    }

    if (updates?.estimatedDeliveryTime) {
      updateData.estimated_delivery_time = updates.estimatedDeliveryTime;
    }

    if (updates?.acceptedAt) {
      updateData.accepted_at = updates.acceptedAt.toISOString();
    }

    if (updates?.deliveredAt) {
      updateData.delivered_at = updates.deliveredAt.toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating order status:', error);
    return false;
  }
}

function mapDatabaseOrderToApp(dbOrder: any): Order {
  console.log('🔄 Mapping order:', dbOrder.id);
  console.log('🔄 order_items count:', dbOrder.order_items?.length || 0);
  console.log('🔄 order_items:', JSON.stringify(dbOrder.order_items, null, 2));

  const items: CartItem[] = (dbOrder.order_items || []).map((item: any) => {
    console.log('🔄 Mapping item:', item.id, 'product:', item.product?.name);
    return {
    product: {
      id: item.product.id,
      reference: item.product.reference,
      name: item.product.name,
      category: item.product.category,
      brand: item.product.brand,
      crateType: item.product.crate_type,
      unitPrice: item.product.unit_price,
      cratePrice: item.product.crate_price,
      consignPrice: item.product.consign_price,
      description: item.product.description,
      alcoholContent: item.product.alcohol_content,
      volume: item.product.volume,
      isActive: item.product.is_active,
      imageUrl: item.product.image_url,
      createdAt: new Date(item.product.created_at),
      updatedAt: new Date(item.product.updated_at),
      pricePerUnit: item.product.crate_price,
      consigneAmount: item.product.consign_price
    },
    quantity: item.quantity,
    withConsigne: item.with_consigne
    };
  });

  const lat = (dbOrder as any).lat;
  const lng = (dbOrder as any).lng;

  const mappedOrder = {
    id: dbOrder.id,
    clientId: dbOrder.client_id,
    supplierId: dbOrder.supplier_id,
    items,
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status as OrderStatus,
    consigneTotal: dbOrder.consigne_total,
    deliveryAddress: dbOrder.delivery_address,
    deliveryZone: dbOrder.zone?.name || 'Zone non spécifiée',
    coordinates: {
      lat: typeof lat === 'number' ? lat : 5.3364,
      lng: typeof lng === 'number' ? lng : -4.0267
    },
    zoneId: dbOrder.zone_id,
    paymentMethod: dbOrder.payment_method as PaymentMethod,
    estimatedDeliveryTime: dbOrder.estimated_delivery_time,
    paymentStatus: dbOrder.payment_status,
    deliveryConfirmationCode: dbOrder.delivery_confirmation_code,
    clientRating: dbOrder.client?.rating ?? undefined,
    deliveryCost: dbOrder.delivery_cost, // Nouveau champ
    ravitoMargin: dbOrder.ravito_margin, // Nouveau champ
    createdAt: new Date(dbOrder.created_at),
    acceptedAt: dbOrder.accepted_at ? new Date(dbOrder.accepted_at) : undefined,
    deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
    paidAt: dbOrder.paid_at ? new Date(dbOrder.paid_at) : undefined,
    transferredAt: dbOrder.transferred_at ? new Date(dbOrder.transferred_at) : undefined
  };

  console.log('✅ Mapped order:', mappedOrder.id, 'items:', mappedOrder.items.length);

  return mappedOrder;
}
