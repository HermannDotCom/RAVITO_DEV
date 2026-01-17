import { supabase } from '../lib/supabase';
import {
  CreditCustomer,
  CreditTransaction,
  CreditTransactionItem,
  AddCreditCustomerData,
  AddConsumptionData,
  AddPaymentData,
  CreditAlert,
  AlertLevel,
  FreezeCustomerData,
  UpdateCustomerData,
  MonthlyCreditStats,
  CustomerDebt,
  AnnualCreditStats,
  MonthlyCreditData,
  CustomerStats,
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
  status: row.status || 'active',
  lastPaymentDate: row.last_payment_date,
  freezeReason: row.freeze_reason,
  frozenAt: row.frozen_at,
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

/**
 * Get credit alerts for an organization
 */
export const getCreditAlerts = async (
  organizationId: string
): Promise<{ data: CreditAlert[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('credit_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .in('alert_level', ['warning', 'critical'])
      .order('days_since_payment', { ascending: false });

    if (error) {
      console.error('Error fetching credit alerts:', error);
      return { data: null, error: error.message };
    }

    const alerts: CreditAlert[] = data?.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      phone: row.phone,
      currentBalance: row.current_balance,
      lastPaymentDate: row.last_payment_date,
      status: row.status,
      creditLimit: row.credit_limit,
      createdAt: row.created_at,
      daysSincePayment: row.days_since_payment,
      alertLevel: row.alert_level as AlertLevel,
    })) || [];

    return { data: alerts, error: null };
  } catch (err) {
    console.error('Error in getCreditAlerts:', err);
    return { data: null, error: 'Failed to fetch credit alerts' };
  }
};

/**
 * Freeze a customer's credit
 */
export const freezeCustomer = async (
  customerId: string,
  freezeData: FreezeCustomerData
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updateData: any = {
      frozen_at: new Date().toISOString(),
      freeze_reason: freezeData.reason,
    };

    if (freezeData.option === 'freeze_full') {
      // Get current balance and set limit to that
      const { data: customer } = await supabase
        .from('credit_customers')
        .select('current_balance')
        .eq('id', customerId)
        .single();
      
      if (customer) {
        updateData.credit_limit = customer.current_balance;
        updateData.status = 'frozen';
      }
    } else if (freezeData.option === 'reduce_limit') {
      updateData.credit_limit = freezeData.newLimit || 0;
      updateData.status = 'frozen';
    } else if (freezeData.option === 'disable') {
      updateData.status = 'disabled';
    }

    const { error } = await supabase
      .from('credit_customers')
      .update(updateData)
      .eq('id', customerId);

    if (error) {
      console.error('Error freezing customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in freezeCustomer:', err);
    return { success: false, error: 'Failed to freeze customer' };
  }
};

/**
 * Unfreeze a customer's credit
 */
export const unfreezeCustomer = async (
  customerId: string,
  newLimit?: number
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updateData: any = {
      status: 'active',
      frozen_at: null,
      freeze_reason: null,
    };

    if (newLimit !== undefined) {
      updateData.credit_limit = newLimit;
    }

    const { error } = await supabase
      .from('credit_customers')
      .update(updateData)
      .eq('id', customerId);

    if (error) {
      console.error('Error unfreezing customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in unfreezeCustomer:', err);
    return { success: false, error: 'Failed to unfreeze customer' };
  }
};

/**
 * Update customer information
 */
export const updateCustomerInfo = async (
  customerId: string,
  updates: UpdateCustomerData
): Promise<{ data: CreditCustomer | null; error: string | null }> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('credit_customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer info:', error);
      return { data: null, error: error.message };
    }

    return {
      data: data ? mapCreditCustomer(data) : null,
      error: null,
    };
  } catch (err) {
    console.error('Error in updateCustomerInfo:', err);
    return { data: null, error: 'Failed to update customer info' };
  }
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (
  customerId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('credit_customers')
      .update({ is_active: false })
      .eq('id', customerId);

    if (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteCustomer:', err);
    return { success: false, error: 'Failed to delete customer' };
  }
};

/**
 * Get monthly credit statistics
 */
export const getMonthlyCreditStats = async (
  organizationId: string,
  month: number,
  year: number
): Promise<{ data: MonthlyCreditStats | null; error: string | null }> => {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    // Get transactions for the month
    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('transaction_type, amount')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (txError) throw txError;

    const totalCredited = transactions
      ?.filter(t => t.transaction_type === 'consumption')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    
    const totalPaid = transactions
      ?.filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get current balances
    const { data: customers, error: custError } = await supabase
      .from('credit_customers')
      .select('current_balance')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (custError) throw custError;

    const endBalance = customers?.reduce((sum, c) => sum + c.current_balance, 0) || 0;

    // Get alerts
    const { data: alerts, error: alertError } = await supabase
      .from('credit_alerts')
      .select('current_balance, alert_level')
      .eq('organization_id', organizationId)
      .in('alert_level', ['warning', 'critical']);

    if (alertError) throw alertError;

    const alertsCount = alerts?.length || 0;
    const amountAtRisk = alerts?.reduce((sum, a) => sum + a.current_balance, 0) || 0;

    // Get top debtors
    const { data: debtors, error: debtorError } = await supabase
      .from('credit_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .gt('current_balance', 0)
      .order('current_balance', { ascending: false })
      .limit(5);

    if (debtorError) throw debtorError;

    const topDebtors: CustomerDebt[] = debtors?.map((d: any) => ({
      id: d.id,
      name: d.name,
      balance: d.current_balance,
      lastPaymentDate: d.last_payment_date,
      daysSincePayment: d.days_since_payment,
      alertLevel: d.alert_level as AlertLevel,
    })) || [];

    const recoveryRate = totalCredited > 0 ? (totalPaid / totalCredited) * 100 : 0;

    return {
      data: {
        totalCredited,
        totalPaid,
        endBalance,
        recoveryRate,
        alertsCount,
        amountAtRisk,
        topDebtors,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error in getMonthlyCreditStats:', err);
    return { data: null, error: 'Failed to fetch monthly credit stats' };
  }
};

/**
 * Get annual credit statistics
 */
export const getAnnualCreditStats = async (
  organizationId: string,
  year: number
): Promise<{ data: AnnualCreditStats | null; error: string | null }> => {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get transactions for the year
    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('transaction_type, amount, transaction_date')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (txError) throw txError;

    const totalCredited = transactions
      ?.filter(t => t.transaction_type === 'consumption')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    
    const totalPaid = transactions
      ?.filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get current balances
    const { data: customers, error: custError } = await supabase
      .from('credit_customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (custError) throw custError;

    const endBalance = customers?.reduce((sum, c) => sum + c.current_balance, 0) || 0;

    // Calculate monthly data
    const monthlyData: MonthlyCreditData[] = [];
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    for (let m = 1; m <= 12; m++) {
      const monthStart = `${year}-${String(m).padStart(2, '0')}-01`;
      const monthEnd = new Date(year, m, 0).toISOString().split('T')[0];

      const monthTxs = transactions?.filter(
        t => t.transaction_date >= monthStart && t.transaction_date <= monthEnd
      ) || [];

      const credited = monthTxs
        .filter(t => t.transaction_type === 'consumption')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const paid = monthTxs
        .filter(t => t.transaction_type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: m,
        monthName: monthNames[m - 1],
        credited,
        paid,
      });
    }

    // Top customers (best recovery rate with minimum activity)
    const topCustomers: CustomerStats[] = customers
      ?.filter(c => c.total_credited >= 10000) // Minimum 10,000 FCFA credited
      .map(c => ({
        id: c.id,
        name: c.name,
        totalCredited: c.total_credited,
        totalPaid: c.total_paid,
        recoveryRate: c.total_credited > 0 ? (c.total_paid / c.total_credited) * 100 : 0,
        currentBalance: c.current_balance,
      }))
      .sort((a, b) => b.recoveryRate - a.recoveryRate)
      .slice(0, 10) || [];

    // At-risk customers (low recovery rate)
    const atRiskCustomers: CustomerStats[] = customers
      ?.filter(c => c.total_credited >= 10000) // Minimum 10,000 FCFA credited
      .map(c => ({
        id: c.id,
        name: c.name,
        totalCredited: c.total_credited,
        totalPaid: c.total_paid,
        recoveryRate: c.total_credited > 0 ? (c.total_paid / c.total_credited) * 100 : 0,
        currentBalance: c.current_balance,
      }))
      .filter(c => c.recoveryRate < 80)
      .sort((a, b) => a.recoveryRate - b.recoveryRate)
      .slice(0, 10) || [];

    // Get previous year comparison
    const prevYearStart = `${year - 1}-01-01`;
    const prevYearEnd = `${year - 1}-12-31`;
    const { data: prevYearTxs } = await supabase
      .from('credit_transactions')
      .select('transaction_type, amount')
      .eq('organization_id', organizationId)
      .gte('transaction_date', prevYearStart)
      .lte('transaction_date', prevYearEnd);

    const prevYearCredited = prevYearTxs
      ?.filter(t => t.transaction_type === 'consumption')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const previousYearComparison = prevYearCredited > 0
      ? ((totalCredited - prevYearCredited) / prevYearCredited) * 100
      : undefined;

    const recoveryRate = totalCredited > 0 ? (totalPaid / totalCredited) * 100 : 0;

    return {
      data: {
        totalCredited,
        totalPaid,
        endBalance,
        recoveryRate,
        previousYearComparison,
        monthlyData,
        topCustomers,
        atRiskCustomers,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error in getAnnualCreditStats:', err);
    return { data: null, error: 'Failed to fetch annual credit stats' };
  }
};
