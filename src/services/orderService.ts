import { supabase } from '../lib/supabase';
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
    const subtotal = items.reduce((sum, item) => sum + (item.product.cratePrice * item.quantity), 0);
    const consigneTotal = items.reduce(
      (sum, item) => sum + (item.withConsigne ? item.product.consignPrice * item.quantity : 0),
      0
    );

    const orderTotal = subtotal + consigneTotal;
    const clientCommission = Math.round(orderTotal * (commissionSettings.clientCommission / 100));
    const totalAmount = orderTotal + clientCommission;

    const orderData: any = {
      client_id: clientId,
      status: 'pending',
      total_amount: totalAmount,
      consigne_total: consigneTotal,
      client_commission: clientCommission,
      supplier_commission: 0,
      net_supplier_amount: 0,
      delivery_address: deliveryAddress,
      coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
      payment_method: paymentMethod,
      payment_status: 'pending',
      zone_id: zoneId || null
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

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
        )
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

export async function getOrdersBySupplier(supplierId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders_with_coords')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
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

export async function getPendingOrders(supplierId?: string): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders_with_coords')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .in('status', ['pending', 'awaiting-client-validation']);

    if (supplierId) {
      const { data: supplierZones, error: zonesError } = await supabase
        .from('supplier_zones')
        .select('zone_id')
        .eq('supplier_id', supplierId)
        .eq('approval_status', 'approved');

      if (zonesError) {
        console.error('Error fetching supplier zones:', zonesError);
        return [];
      }

      const zoneIds = supplierZones.map(sz => sz.zone_id);

      if (zoneIds.length === 0) {
        return [];
      }

      query = query.in('zone_id', zoneIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }

    return data.map(mapDatabaseOrderToApp);
  } catch (error) {
    console.error('Exception fetching pending orders:', error);
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
  const items: CartItem[] = dbOrder.order_items.map((item: any) => ({
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
  }));

  const lat = (dbOrder as any).lat;
  const lng = (dbOrder as any).lng;

  return {
    id: dbOrder.id,
    clientId: dbOrder.client_id,
    supplierId: dbOrder.supplier_id,
    items,
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status as OrderStatus,
    consigneTotal: dbOrder.consigne_total,
    deliveryAddress: dbOrder.delivery_address,
    coordinates: {
      lat: typeof lat === 'number' ? lat : 5.3364,
      lng: typeof lng === 'number' ? lng : -4.0267
    },
    paymentMethod: dbOrder.payment_method as PaymentMethod,
    estimatedDeliveryTime: dbOrder.estimated_delivery_time,
    paymentStatus: dbOrder.payment_status,
    createdAt: new Date(dbOrder.created_at),
    acceptedAt: dbOrder.accepted_at ? new Date(dbOrder.accepted_at) : undefined,
    deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
    paidAt: dbOrder.paid_at ? new Date(dbOrder.paid_at) : undefined,
    transferredAt: dbOrder.transferred_at ? new Date(dbOrder.transferred_at) : undefined
  };
}
