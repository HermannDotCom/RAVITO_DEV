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
  organizationId: string,
  date: string
): Promise<{ data: DailySheet | null; error: string | null }> => {
  try {
    if (!organizationId) {
      return {
        data: null,
        error: 'Organization ID is required'
      };
    }

    // First try to get existing sheet
    const { data: existingSheets, error: fetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sheet_date', date);

    if (fetchError) {
      console.error('Error fetching daily sheet:', fetchError);
      return {
        data: null,
        error: fetchError.message || 'Failed to fetch daily sheet'
      };
    }

    // If sheet exists, return it
    if (existingSheets && existingSheets.length > 0) {
      return {
        data: mapDailySheet(existingSheets[0]),
        error: null
      };
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
        console.log('Sheet was created by another request, fetching...');
        const { data: retrySheets } = await supabase
          .from('daily_sheets')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('sheet_date', date);

        if (retrySheets && retrySheets.length > 0) {
          return {
            data: mapDailySheet(retrySheets[0]),
            error: null
          };
        }
      }

      console.error('Error creating daily sheet:', createError);
      return {
        data: null,
        error: createError.message || 'Failed to create daily sheet'
      };
    }

    // Fetch the newly created sheet
    const { data: newSheet, error: newFetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('id', newSheetId)
      .single();

    if (newFetchError) {
      console.error('Error fetching new daily sheet:', newFetchError);
      return {
        data: null,
        error: newFetchError.message || 'Failed to fetch created sheet'
      };
    }

    return {
      data: mapDailySheet(newSheet),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getOrCreateDailySheet:', error);
    return {
      data: null,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get stock lines for a daily sheet
 */
export const getDailyStockLines = async (
  sheetId: string
): Promise<{ data: DailyStockLine[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('daily_stock_lines')
      .select(`
        *,
        product: products(id, name, reference, crate_type, image_url)
      `)
      .eq('daily_sheet_id', sheetId);

    if (error) {
      console.error('Error fetching stock lines:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch stock lines'
      };
    }

    return {
      data: (data || []).map(mapStockLine),
      error: null
    };
  } catch (err: any) {
    console.error('Error in getDailyStockLines:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Update a stock line
 */
export const updateStockLine = async (
  lineId: string,
  updates: Partial<Pick<DailyStockLine, 'externalSupply' | 'finalStock'>>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const dbUpdates: Record<string, any> = {};

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
      return {
        success: false,
        error: error.message || 'Failed to update stock line'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in updateStockLine:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get packaging lines for a daily sheet
 */
export const getDailyPackaging = async (
  sheetId: string
): Promise<{ data: DailyPackaging[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('daily_packaging')
      .select('*')
      .eq('daily_sheet_id', sheetId);

    if (error) {
      console.error('Error fetching packaging:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch packaging'
      };
    }

    return {
      data: (data || []).map(mapPackaging),
      error: null
    };
  } catch (err: any) {
    console.error('Error in getDailyPackaging:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Update a packaging line
 */
export const updatePackaging = async (
  packagingId: string,
  updates: Partial<Pick<DailyPackaging, 'qtyReturned' | 'qtyFullEnd' | 'qtyEmptyEnd'>>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const dbUpdates: Record<string, any> = {};

    if (updates.qtyReturned !== undefined) {
      dbUpdates.qty_returned = updates.qtyReturned;
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
      return {
        success: false,
        error: error.message || 'Failed to update packaging'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in updatePackaging:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get expenses for a daily sheet
 */
export const getDailyExpenses = async (
  sheetId: string
): Promise<{ data: DailyExpense[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('daily_sheet_id', sheetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch expenses'
      };
    }

    return {
      data: (data || []).map(mapExpense),
      error: null
    };
  } catch (err: any) {
    console.error('Error in getDailyExpenses:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Add a new expense
 */
export const addExpense = async (
  sheetId: string,
  expenseData: { label: string; amount: number; category?: string }
): Promise<{ data: DailyExpense | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('daily_expenses')
      .insert({
        daily_sheet_id: sheetId,
        label: expenseData.label,
        amount: expenseData.amount,
        category: expenseData.category || 'other'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return {
        data: null,
        error: error.message || 'Failed to add expense'
      };
    }

    return {
      data: mapExpense(data),
      error: null
    };
  } catch (err: any) {
    console.error('Error in addExpense:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (
  expenseId: string,
  sheetId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('daily_sheet_id', sheetId);

    if (error) {
      console.error('Error deleting expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete expense'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in deleteExpense:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Update daily sheet (opening cash, closing cash, notes)
 */
export const updateDailySheet = async (
  sheetId: string,
  updates: Partial<Pick<DailySheet, 'openingCash' | 'closingCash' | 'notes'>>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const dbUpdates: Record<string, any> = {};

    if (updates.openingCash !== undefined) {
      dbUpdates.opening_cash = updates.openingCash;
    }
    if (updates.closingCash !== undefined) {
      dbUpdates.closing_cash = updates.closingCash;
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes;
    }

    const { error } = await supabase
      .from('daily_sheets')
      .update(dbUpdates)
      .eq('id', sheetId);

    if (error) {
      console.error('Error updating daily sheet:', error);
      return {
        success: false,
        error: error.message || 'Failed to update daily sheet'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in updateDailySheet:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Close a daily sheet
 */
export const closeDailySheet = async (
  sheetId: string,
  closeData: { closingCash: number; theoreticalRevenue: number; expensesTotal: number },
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const cashDifference = closeData.closingCash - closeData.theoreticalRevenue + closeData.expensesTotal;

    const { error } = await supabase
      .from('daily_sheets')
      .update({
        status: 'closed',
        closing_cash: closeData.closingCash,
        theoretical_revenue: closeData.theoreticalRevenue,
        expenses_total: closeData.expensesTotal,
        cash_difference: cashDifference,
        closed_at: new Date().toISOString(),
        closed_by: userId
      })
      .eq('id', sheetId);

    if (error) {
      console.error('Error closing daily sheet:', error);
      return {
        success: false,
        error: error.message || 'Failed to close daily sheet'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in closeDailySheet:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Sync RAVITO deliveries to daily sheet
 */
export const syncRavitoDeliveries = async (
  sheetId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .rpc('sync_ravito_deliveries_to_daily_sheet', {
        p_sheet_id: sheetId
      });

    if (error) {
      console.error('Error syncing RAVITO deliveries:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync deliveries'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in syncRavitoDeliveries:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get establishment products for configuration
 */
export const getEstablishmentProducts = async (
  organizationId: string
): Promise<{ data: any[] | null; error: string | null }> => {
  try {
    if (!organizationId) {
      return {
        data: [],
        error: null
      };
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
      return {
        data: null,
        error: error.message || 'Failed to fetch establishment products'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err: any) {
    console.error('Error in getEstablishmentProducts:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
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