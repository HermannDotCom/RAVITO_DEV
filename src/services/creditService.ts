import { supabase } from '../lib/supabase';
import {
  CreditCustomer,
  CreditTransaction,
  CreditTransactionItem,
  AddCreditCustomerData,
  AddConsumptionData,
  AddPaymentData,
} from '../types/activity';

/**
 * Map database row to CreditCustomer type
 */
const mapCreditCustomer = (row: any): CreditCustomer => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  phone: row.phone,
  address: row.address,
  notes: row.notes,
  creditLimit: row.credit_limit,
  currentBalance: row.current_balance,
  totalCredited: row.total_credited,
  totalPaid: row.total_paid,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Map database row to CreditTransaction type
 */
const mapCreditTransaction = (row: any): CreditTransaction => ({
  id: row.id,
  organizationId: row.organization_id,
  customerId: row.customer_id,
  dailySheetId: row.daily_sheet_id,
  transactionType: row.transaction_type,
  amount: row.amount,
  paymentMethod: row.payment_method,
  notes: row.notes,
  transactionDate: row.transaction_date,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

/**
 * Map database row to CreditTransactionItem type
 */
const mapCreditTransactionItem = (row: any): CreditTransactionItem => ({
  id: row.id,
  transactionId: row.transaction_id,
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  subtotal: row.subtotal,
  createdAt: row.created_at,
});

/**
 * Get all credit customers for an organization
 */
export const getCreditCustomers = async (
  organizationId: string
): Promise<{ data: CreditCustomer[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('credit_customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching credit customers:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data?.map(mapCreditCustomer) || [],
      error: null,
    };
  } catch (err) {
    console.error('Error in getCreditCustomers:', err);
    return { data: null, error: 'Failed to fetch credit customers' };
  }
};

/**
 * Get a single credit customer by ID
 */
export const getCreditCustomer = async (
  customerId: string
): Promise<{ data: CreditCustomer | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('credit_customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Error fetching credit customer:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data ? mapCreditCustomer(data) : null,
      error: null,
    };
  } catch (err) {
    console.error('Error in getCreditCustomer:', err);
    return { data: null, error: 'Failed to fetch credit customer' };
  }
};

/**
 * Create a new credit customer
 */
export const addCreditCustomer = async (
  organizationId: string,
  customerData: AddCreditCustomerData
): Promise<{ data: CreditCustomer | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('credit_customers')
      .insert({
        organization_id: organizationId,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        notes: customerData.notes,
        credit_limit: customerData.creditLimit || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding credit customer:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data ? mapCreditCustomer(data) : null,
      error: null,
    };
  } catch (err) {
    console.error('Error in addCreditCustomer:', err);
    return { data: null, error: 'Failed to add credit customer' };
  }
};

/**
 * Update a credit customer
 */
export const updateCreditCustomer = async (
  customerId: string,
  updates: Partial<AddCreditCustomerData>
): Promise<{ data: CreditCustomer | null; error: string | null }> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;

    const { data, error } = await supabase
      .from('credit_customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit customer:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data ? mapCreditCustomer(data) : null,
      error: null,
    };
  } catch (err) {
    console.error('Error in updateCreditCustomer:', err);
    return { data: null, error: 'Failed to update credit customer' };
  }
};

/**
 * Get transactions for a customer
 */
export const getCustomerTransactions = async (
  customerId: string,
  limit?: number
): Promise<{ data: CreditTransaction[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer transactions:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data?.map(mapCreditTransaction) || [],
      error: null,
    };
  } catch (err) {
    console.error('Error in getCustomerTransactions:', err);
    return { data: null, error: 'Failed to fetch customer transactions' };
  }
};

/**
 * Get transaction items for a transaction
 */
export const getTransactionItems = async (
  transactionId: string
): Promise<{ data: CreditTransactionItem[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('credit_transaction_items')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching transaction items:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data?.map(mapCreditTransactionItem) || [],
      error: null,
    };
  } catch (err) {
    console.error('Error in getTransactionItems:', err);
    return { data: null, error: 'Failed to fetch transaction items' };
  }
};

/**
 * Add a consumption (credit sale)
 */
export const addConsumption = async (
  organizationId: string,
  dailySheetId: string | undefined,
  userId: string,
  consumptionData: AddConsumptionData
): Promise<{ data: CreditTransaction | null; error: string | null }> => {
  try {
    // Calculate total amount
    const totalAmount = consumptionData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: organizationId,
        customer_id: consumptionData.customerId,
        daily_sheet_id: dailySheetId,
        transaction_type: 'consumption',
        amount: totalAmount,
        notes: consumptionData.notes,
        transaction_date: consumptionData.transactionDate,
        created_by: userId,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error adding consumption transaction:', transactionError);
      return { data: null, error: transactionError.message };
    }

    // Insert transaction items
    const items = consumptionData.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from('credit_transaction_items')
      .insert(items);

    if (itemsError) {
      console.error('Error adding consumption items:', itemsError);
      // Transaction was created, but items failed - should we rollback?
      return { data: null, error: itemsError.message };
    }

    return {
      data: mapCreditTransaction(transaction),
      error: null,
    };
  } catch (err) {
    console.error('Error in addConsumption:', err);
    return { data: null, error: 'Failed to add consumption' };
  }
};

/**
 * Add a payment
 */
export const addPayment = async (
  organizationId: string,
  dailySheetId: string | undefined,
  userId: string,
  paymentData: AddPaymentData
): Promise<{ data: CreditTransaction | null; error: string | null }> => {
  try {
    const transactionDate = new Date().toISOString().split('T')[0];

    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: organizationId,
        customer_id: paymentData.customerId,
        daily_sheet_id: dailySheetId,
        transaction_type: 'payment',
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes,
        transaction_date: transactionDate,
        created_by: userId,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error adding payment transaction:', transactionError);
      return { data: null, error: transactionError.message };
    }

    return {
      data: mapCreditTransaction(transaction),
      error: null,
    };
  } catch (err) {
    console.error('Error in addPayment:', err);
    return { data: null, error: 'Failed to add payment' };
  }
};

/**
 * Get credit statistics for an organization
 */
export const getCreditStatistics = async (
  organizationId: string
): Promise<{
  data: { totalCredit: number; customersWithBalance: number } | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('credit_customers')
      .select('current_balance')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching credit statistics:', error);
      return { data: null, error: error.message };
    }

    const totalCredit = data?.reduce((sum, c) => sum + c.current_balance, 0) || 0;
    const customersWithBalance = data?.filter((c) => c.current_balance > 0).length || 0;

    return {
      data: { totalCredit, customersWithBalance },
      error: null,
    };
  } catch (err) {
    console.error('Error in getCreditStatistics:', err);
    return { data: null, error: 'Failed to fetch credit statistics' };
  }
};
