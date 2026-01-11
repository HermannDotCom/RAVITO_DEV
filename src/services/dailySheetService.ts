import { supabase } from '../lib/supabase';
import { DailySheet, DailyStockLine, DailyPackaging, DailyExpense } from '../types/activity';

/**
 * Get the organization ID for the current user
 * Checks if user is owner or member of an organization
 */
export const getUserOrganizationId = async (userId: string): Promise<string | null> => {
  // First check if user owns an organization
  const { data: ownedOrg } = await supabase
    . from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (ownedOrg?. id) {
    return ownedOrg.id;
  }

  // Then check if user is a member of an organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return membership?.organization_id || null;
};

/**
 * Get or create a daily sheet for the given organization and date
 */
export const getOrCreateDailySheet = async (
  userId: string,
  date: string
): Promise<DailySheet | null> => {
  try {
    // Get the user's organization ID
    const organizationId = await getUserOrganizationId(userId);
    
    if (!organizationId) {
      console.error('User does not belong to any organization');
      throw new Error('Vous devez appartenir à une organisation pour utiliser cette fonctionnalité.');
    }

    // First try to get existing sheet (using array response to avoid RLS issues)
    const { data: existingSheets, error: fetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sheet_date', date);

    if (fetchError) {
      console.error('Error fetching daily sheet:', fetchError);
      throw fetchError;
    }

    // If sheet exists, return it
    if (existingSheets && existingSheets.length > 0) {
      return mapDailySheet(existingSheets[0]);
    }

    // Create new sheet using the RPC function
    const { data: newSheetId, error: createError } = await supabase
      .rpc('create_daily_sheet_with_carryover', {
        p_organization_id: organizationId,
        p_date: date
      });

    if (createError) {
      // If duplicate key error (race condition), try to fetch again
      if (createError.code === '23505') {
        console.log('Sheet was created by another request, fetching.. .');
        const { data: retrySheets } = await supabase
          .from('daily_sheets')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('sheet_date', date);
        
        if (retrySheets && retrySheets.length > 0) {
          return mapDailySheet(retrySheets[0]);
        }
      }
      
      console.error('Error creating daily sheet:', createError);
      throw createError;
    }

    // Fetch the newly created sheet
    const { data: newSheet, error:  newFetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('id', newSheetId)
      .single();

    if (newFetchError) {
      console.error('Error fetching new daily sheet:', newFetchError);
      throw newFetchError;
    }

    return mapDailySheet(newSheet);
  } catch (error) {
    console.error('Error in getOrCreateDailySheet:', error);
    throw error;
  }
};

/**
 * Get stock lines for a daily sheet
 */
export const getDailyStockLines = async (sheetId: string): Promise<DailyStockLine[]> => {
  const { data, error } = await supabase
    .from('daily_stock_lines')
    .select(`
      *,
      product: products(id, name, reference, crate_type, image_url)
    `)
    .eq('daily_sheet_id', sheetId);

  if (error) {
    console.error('Error fetching stock lines:', error);
    throw error;
  }

  return (data || []).map(mapStockLine);
};

/**
 * Update a stock line
 */
export const updateStockLine = async (
  lineId: string,
  updates: Partial<Pick<DailyStockLine, 'externalSupply' | 'finalStock'>>
): Promise<void> => {
  const dbUpdates:  Record<string, any> = {};
  
  if (updates.externalSupply !== undefined) {
    dbUpdates.external_supply = updates.externalSupply;
  }
  if (updates.finalStock !== undefined) {
    dbUpdates.final_stock = updates.finalStock;
  }

  const { error } = await supabase
    .from('daily_stock_lines')
    .update(dbUpdates)
    .eq('id', lineId);

  if (error) {
    console.error('Error updating stock line:', error);
    throw error;
  }
};

/**
 * Get packaging lines for a daily sheet
 */
export const getDailyPackaging = async (sheetId: string): Promise<DailyPackaging[]> => {
  const { data, error } = await supabase
    .from('daily_packaging')
    .select('*')
    .eq('daily_sheet_id', sheetId);

  if (error) {
    console.error('Error fetching packaging:', error);
    throw error;
  }

  return (data || []).map(mapPackaging);
};

/**
 * Update a packaging line
 */
export const updatePackaging = async (
  packagingId: string,
  updates: Partial<Pick<DailyPackaging, 'qtyReturned' | 'qtyFullEnd' | 'qtyEmptyEnd'>>
): Promise<void> => {
  const dbUpdates: Record<string, any> = {};
  
  if (updates.qtyReturned !== undefined) {
    dbUpdates.qty_returned = updates. qtyReturned;
  }
  if (updates.qtyFullEnd !== undefined) {
    dbUpdates.qty_full_end = updates.qtyFullEnd;
  }
  if (updates.qtyEmptyEnd !== undefined) {
    dbUpdates.qty_empty_end = updates.qtyEmptyEnd;
  }

  const { error } = await supabase
    .from('daily_packaging')
    .update(dbUpdates)
    .eq('id', packagingId);

  if (error) {
    console.error('Error updating packaging:', error);
    throw error;
  }
};

/**
 * Get expenses for a daily sheet
 */
export const getDailyExpenses = async (sheetId: string): Promise<DailyExpense[]> => {
  const { data, error } = await supabase
    .from('daily_expenses')
    .select('*')
    .eq('daily_sheet_id', sheetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return (data || []).map(mapExpense);
};

/**
 * Add a new expense
 */
export const addExpense = async (
  sheetId: string,
  label: string,
  amount: number,
  category: string = 'other'
): Promise<DailyExpense> => {
  const { data, error } = await supabase
    .from('daily_expenses')
    .insert({
      daily_sheet_id:  sheetId,
      label,
      amount,
      category
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    throw error;
  }

  return mapExpense(data);
};

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  const { error } = await supabase
    . from('daily_expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Update daily sheet (opening cash, closing cash, notes)
 */
export const updateDailySheet = async (
  sheetId: string,
  updates: Partial<Pick<DailySheet, 'openingCash' | 'closingCash' | 'notes'>>
): Promise<void> => {
  const dbUpdates: Record<string, any> = {};
  
  if (updates.openingCash !== undefined) {
    dbUpdates.opening_cash = updates.openingCash;
  }
  if (updates.closingCash !== undefined) {
    dbUpdates.closing_cash = updates. closingCash;
  }
  if (updates.notes !== undefined) {
    dbUpdates.notes = updates.notes;
  }

  const { error } = await supabase
    . from('daily_sheets')
    .update(dbUpdates)
    .eq('id', sheetId);

  if (error) {
    console.error('Error updating daily sheet:', error);
    throw error;
  }
};

/**
 * Close a daily sheet
 */
export const closeDailySheet = async (
  sheetId: string,
  closingCash: number,
  theoreticalRevenue: number,
  expensesTotal: number,
  userId: string
): Promise<void> => {
  const cashDifference = closingCash - theoreticalRevenue + expensesTotal;

  const { error } = await supabase
    .from('daily_sheets')
    .update({
      status: 'closed',
      closing_cash: closingCash,
      theoretical_revenue: theoreticalRevenue,
      expenses_total: expensesTotal,
      cash_difference: cashDifference,
      closed_at: new Date().toISOString(),
      closed_by: userId
    })
    .eq('id', sheetId);

  if (error) {
    console.error('Error closing daily sheet:', error);
    throw error;
  }
};

/**
 * Sync RAVITO deliveries to daily sheet
 */
export const syncRavitoDeliveries = async (sheetId: string): Promise<void> => {
  const { error } = await supabase
    .rpc('sync_ravito_deliveries_to_daily_sheet', {
      p_sheet_id: sheetId
    });

  if (error) {
    console.error('Error syncing RAVITO deliveries:', error);
    throw error;
  }
};

/**
 * Get establishment products for configuration
 */
export const getEstablishmentProducts = async (userId: string): Promise<any[]> => {
  const organizationId = await getUserOrganizationId(userId);
  
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('establishment_products')
    .select(`
      *,
      product:products(id, name, reference, crate_type, image_url)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching establishment products:', error);
    throw error;
  }

  return data || [];
};

/**
 * Add or update an establishment product
 */
export const upsertEstablishmentProduct = async (
  userId: string,
  productId:  string,
  sellingPrice: number
): Promise<void> => {
  const organizationId = await getUserOrganizationId(userId);
  
  if (!organizationId) {
    throw new Error('User does not belong to any organization');
  }

  const { error } = await supabase
    . from('establishment_products')
    .upsert({
      organization_id: organizationId,
      product_id: productId,
      selling_price: sellingPrice,
      is_active: true
    }, {
      onConflict: 'organization_id,product_id'
    });

  if (error) {
    console.error('Error upserting establishment product:', error);
    throw error;
  }
};

// ============================================
// MAPPERS
// ============================================

const mapDailySheet = (data: any): DailySheet => ({
  id: data.id,
  organizationId: data.organization_id,
  sheetDate: data.sheet_date,
  status: data.status,
  openingCash: data.opening_cash || 0,
  closingCash: data.closing_cash,
  theoreticalRevenue:  data.theoretical_revenue || 0,
  cashDifference: data.cash_difference,
  expensesTotal: data.expenses_total || 0,
  notes: data.notes,
  closedAt: data.closed_at,
  closedBy: data. closed_by,
  createdAt: data.created_at,
  updatedAt: data. updated_at
});

const mapStockLine = (data: any): DailyStockLine => ({
  id: data.id,
  dailySheetId: data.daily_sheet_id,
  productId: data. product_id,
  initialStock: data.initial_stock || 0,
  ravitoSupply: data.ravito_supply || 0,
  externalSupply: data.external_supply || 0,
  finalStock: data.final_stock,
  product: data.product,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const mapPackaging = (data: any): DailyPackaging => ({
  id: data.id,
  dailySheetId:  data.daily_sheet_id,
  crateType: data.crate_type,
  qtyFullStart: data.qty_full_start || 0,
  qtyEmptyStart: data.qty_empty_start || 0,
  qtyReceived: data.qty_received || 0,
  qtyReturned: data.qty_returned || 0,
  qtyFullEnd: data.qty_full_end,
  qtyEmptyEnd: data.qty_empty_end,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const mapExpense = (data: any): DailyExpense => ({
  id: data.id,
  dailySheetId:  data.daily_sheet_id,
  label: data.label,
  amount: data.amount,
  category: data.category || 'other',
  createdAt: data.created_at
});