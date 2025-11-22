import { supabase } from '../lib/supabase';
import { Transfer, TransferMethod, TransferOrder } from '../types';

export interface CreateTransferInput {
  supplierId: string;
  supplierName: string;
  amount: number;
  orderIds: string[];
  transferMethod?: TransferMethod;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new transfer record in the database
 */
export async function createTransfer(
  input: CreateTransferInput,
  userId: string
): Promise<{ success: boolean; transferId?: string; error?: string }> {
  try {
    // First, check if any orders are already in another transfer
    const { data: existingTransferOrders, error: checkError } = await supabase
      .from('transfer_orders')
      .select('order_id')
      .in('order_id', input.orderIds);

    if (checkError) {
      console.error('Error checking existing transfers:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingTransferOrders && existingTransferOrders.length > 0) {
      const alreadyTransferred = existingTransferOrders.map(to => to.order_id);
      return { 
        success: false, 
        error: `Orders already in transfer: ${alreadyTransferred.join(', ')}` 
      };
    }

    // Get the orders to validate and calculate amounts
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, supplier_id, status')
      .in('id', input.orderIds)
      .eq('supplier_id', input.supplierId)
      .eq('status', 'delivered');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return { success: false, error: ordersError.message };
    }

    if (!orders || orders.length === 0) {
      return { success: false, error: 'No valid orders found for transfer' };
    }

    // Verify all requested orders were found and are valid
    if (orders.length !== input.orderIds.length) {
      return { 
        success: false, 
        error: 'Some orders are not valid or already transferred' 
      };
    }

    // Create the transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert([
        {
          supplier_id: input.supplierId,
          supplier_name: input.supplierName,
          amount: input.amount,
          order_count: orders.length,
          transfer_method: input.transferMethod || 'bank_transfer',
          status: 'pending',
          created_by: userId,
          metadata: input.metadata || {},
          notes: input.notes
        }
      ])
      .select()
      .single();

    if (transferError) {
      console.error('Error creating transfer:', transferError);
      return { success: false, error: transferError.message };
    }

    // Create transfer_orders junction records
    const transferOrders = orders.map(order => ({
      transfer_id: transfer.id,
      order_id: order.id,
      order_amount: order.total_amount
    }));

    const { error: junctionError } = await supabase
      .from('transfer_orders')
      .insert(transferOrders);

    if (junctionError) {
      console.error('Error creating transfer orders:', junctionError);
      // Rollback: delete the transfer
      await supabase.from('transfers').delete().eq('id', transfer.id);
      return { success: false, error: junctionError.message };
    }

    return { success: true, transferId: transfer.id };
  } catch (error) {
    console.error('Unexpected error creating transfer:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all transfers with optional filters
 */
export async function getTransfers(filters?: {
  supplierId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Transfer[]> {
  try {
    let query = supabase
      .from('transfers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transfers:', error);
      return [];
    }

    return (data || []).map(mapTransferFromDb);
  } catch (error) {
    console.error('Unexpected error fetching transfers:', error);
    return [];
  }
}

/**
 * Get a single transfer by ID with its associated orders
 */
export async function getTransferById(transferId: string): Promise<{
  transfer: Transfer | null;
  orders: TransferOrder[];
}> {
  try {
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    if (transferError || !transfer) {
      console.error('Error fetching transfer:', transferError);
      return { transfer: null, orders: [] };
    }

    const { data: orders, error: ordersError } = await supabase
      .from('transfer_orders')
      .select('*')
      .eq('transfer_id', transferId);

    if (ordersError) {
      console.error('Error fetching transfer orders:', ordersError);
      return { transfer: mapTransferFromDb(transfer), orders: [] };
    }

    return {
      transfer: mapTransferFromDb(transfer),
      orders: (orders || []).map(mapTransferOrderFromDb)
    };
  } catch (error) {
    console.error('Unexpected error fetching transfer:', error);
    return { transfer: null, orders: [] };
  }
}

/**
 * Approve a transfer
 */
export async function approveTransfer(
  transferId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transfers')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .eq('status', 'pending'); // Only approve pending transfers

    if (error) {
      console.error('Error approving transfer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error approving transfer:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Complete a transfer (mark as paid/transferred)
 */
export async function completeTransfer(
  transferId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transfers')
      .update({
        status: 'completed',
        completed_by: userId,
        completed_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .in('status', ['pending', 'approved']); // Can complete pending or approved transfers

    if (error) {
      console.error('Error completing transfer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error completing transfer:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a transfer
 */
export async function rejectTransfer(
  transferId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transfers')
      .update({
        status: 'rejected',
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', transferId)
      .eq('status', 'pending'); // Only reject pending transfers

    if (error) {
      console.error('Error rejecting transfer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error rejecting transfer:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get recent transfers (limited to last 10)
 */
export async function getRecentTransfers(limit: number = 10): Promise<Transfer[]> {
  return getTransfers({ limit });
}

/**
 * Map database transfer to TypeScript Transfer type
 */
function mapTransferFromDb(dbTransfer: any): Transfer {
  return {
    id: dbTransfer.id,
    supplierId: dbTransfer.supplier_id,
    supplierName: dbTransfer.supplier_name,
    amount: dbTransfer.amount,
    orderCount: dbTransfer.order_count,
    transferMethod: dbTransfer.transfer_method,
    status: dbTransfer.status,
    createdBy: dbTransfer.created_by,
    approvedBy: dbTransfer.approved_by,
    approvedAt: dbTransfer.approved_at ? new Date(dbTransfer.approved_at) : undefined,
    completedAt: dbTransfer.completed_at ? new Date(dbTransfer.completed_at) : undefined,
    completedBy: dbTransfer.completed_by,
    rejectedAt: dbTransfer.rejected_at ? new Date(dbTransfer.rejected_at) : undefined,
    rejectedBy: dbTransfer.rejected_by,
    rejectionReason: dbTransfer.rejection_reason,
    metadata: dbTransfer.metadata,
    notes: dbTransfer.notes,
    createdAt: new Date(dbTransfer.created_at),
    updatedAt: new Date(dbTransfer.updated_at)
  };
}

/**
 * Map database transfer_order to TypeScript TransferOrder type
 */
function mapTransferOrderFromDb(dbTransferOrder: any): TransferOrder {
  return {
    id: dbTransferOrder.id,
    transferId: dbTransferOrder.transfer_id,
    orderId: dbTransferOrder.order_id,
    orderAmount: dbTransferOrder.order_amount,
    createdAt: new Date(dbTransferOrder.created_at)
  };
}
