import { supabase } from '../lib/supabase';
import { DailySheet, DailyStockLine, DailyPackaging, DailyExpense, EstablishmentProduct } from '../types/activity';

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
      if (createError.code === '23505') {
        const { data: retrySheet } = await supabase
          .from('daily_sheets')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('sheet_date', date)
          .maybeSingle();

        if (retrySheet) {
          return { data: mapDailySheet(retrySheet), error: null };
        }
      }

      console.error('Error creating daily sheet:', createError);
      return {
        data: null,
        error: createError.message || 'Failed to create daily sheet'
      };
    }

    // Fetch the newly created sheet — use maybeSingle to avoid PGRST116 crash
    const fetchQuery = newSheetId
      ? supabase.from('daily_sheets').select('*').eq('id', newSheetId).maybeSingle()
      : supabase.from('daily_sheets').select('*').eq('organization_id', organizationId).eq('sheet_date', date).maybeSingle();

    const { data: newSheet, error: newFetchError } = await fetchQuery;

    if (newFetchError || !newSheet) {
      console.error('Error fetching new daily sheet:', newFetchError);
      return {
        data: null,
        error: newFetchError?.message || 'Failed to fetch created sheet'
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
  sheetId: string,
  organizationId?: string
): Promise<{ data: DailyStockLine[] | null; error: string | null }> => {
  try {
    // 1. Récupérer les stock lines avec le produit
    const { data: stockLines, error: stockError } = await supabase
      .from('daily_stock_lines')
      .select(`
        *,
        product: products(id, name, reference, brand, crate_type, crate_price, image_url)
      `)
      .eq('daily_sheet_id', sheetId);

    if (stockError) {
      console.error('Error fetching stock lines:', stockError);
      return {
        data: null,
        error: stockError.message || 'Failed to fetch stock lines'
      };
    }

    // Si pas d'organizationId, retourner sans les prix de vente
    if (!organizationId || !stockLines || stockLines.length === 0) {
      return {
        data: (stockLines || []).map(line => mapStockLine(line)),
        error: null
      };
    }

    // 2. Récupérer les prix de vente depuis establishment_products
    const productIds = stockLines.map(line => line.product_id);
    const { data: estProducts, error: estError } = await supabase
      .from('establishment_products')
      .select('product_id, selling_price, is_active')
      .eq('organization_id', organizationId)
      .in('product_id', productIds);

    if (estError) {
      console.error('Error fetching establishment products:', estError);
      // Continuer sans les prix plutôt que d'échouer
    }

    // 3. Créer un map des prix de vente par product_id (produits actifs uniquement)
    const priceMap = new Map<string, number>();
    if (estProducts) {
      estProducts
        .filter(ep => ep.is_active)
        .forEach(ep => {
          priceMap.set(ep.product_id, ep.selling_price);
        });
    }

    // 4. Mapper les stock lines avec les prix de vente
    const mappedLines = stockLines.map(line => {
      const mapped = mapStockLine(line);
      return {
        ...mapped,
        establishmentProduct: {
          sellingPrice: priceMap.get(line.product_id) || 0
        }
      };
    });

    return {
      data: mappedLines,
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
  updates: Partial<Pick<DailyPackaging, 'qtyFullStart' | 'qtyEmptyStart' | 'qtyConsignesPaid' | 'qtyReturned' | 'qtyFullEnd' | 'qtyEmptyEnd' | 'notes'>>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const dbUpdates: Record<string, any> = {};

    if (updates.qtyFullStart !== undefined) {
      dbUpdates.qty_full_start = updates.qtyFullStart;
    }
    if (updates.qtyEmptyStart !== undefined) {
      dbUpdates.qty_empty_start = updates.qtyEmptyStart;
    }
    if (updates.qtyConsignesPaid !== undefined) {
      dbUpdates.qty_consignes_paid = updates.qtyConsignesPaid;
    }
    if (updates.qtyReturned !== undefined) {
      dbUpdates.qty_returned = updates.qtyReturned;
    }
    if (updates.qtyFullEnd !== undefined) {
      dbUpdates.qty_full_end = updates.qtyFullEnd;
    }
    if (updates.qtyEmptyEnd !== undefined) {
      dbUpdates.qty_empty_end = updates.qtyEmptyEnd;
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes;
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
  closeData: { closingCash: number; theoreticalRevenue: number; expensesTotal: number; openingCash: number; notes?: string },
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Calculate cash difference: closing_cash - expected_cash
    // expected_cash = opening_cash + theoretical_revenue - expenses_total + credit_variation
    const expectedCash = closeData.openingCash + closeData.theoreticalRevenue - closeData.expensesTotal + creditVariation;
    const cashDifference = closeData.closingCash - expectedCash;

    const { error } = await supabase
      .from('daily_sheets')
      .update({
        status: 'closed',
        closing_cash: closeData.closingCash,
        theoretical_revenue: closeData.theoreticalRevenue,
        expenses_total: closeData.expensesTotal,
        cash_difference: cashDifference,
        notes: closeData.notes || null,
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
): Promise<{ data: EstablishmentProduct[] | null; error: string | null }> => {
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
        product:products(id, name, reference, crate_type, crate_price, image_url)
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
      data: (data || []).map(mapEstablishmentProduct),
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

/**
 * Search catalog products
 */
export const searchCatalogProducts = async (
  query: string,
  category?: string,
  excludeProductIds?: string[]
): Promise<{ data: any[] | null; error: string | null }> => {
  try {
    let queryBuilder = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // Apply category filter
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Apply search filter (name, reference, or brand)
    if (query && query.length >= 3) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,reference.ilike.%${query}%,brand.ilike.%${query}%`
      );
    }

    // Exclude already configured products - Using array filter for safety
    if (excludeProductIds && excludeProductIds.length > 0) {
      // Validate all IDs are valid UUIDs to prevent injection
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = excludeProductIds.filter(id => uuidRegex.test(id));
      
      if (validIds.length > 0) {
        queryBuilder = queryBuilder.filter('id', 'not.in', `(${validIds.join(',')})`);
      }
    }

    // Limit results
    queryBuilder = queryBuilder.limit(20);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error searching catalog products:', error);
      return {
        data: null,
        error: error.message || 'Failed to search products'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err: any) {
    console.error('Error in searchCatalogProducts:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Add a product to establishment configuration
 */
export const addEstablishmentProduct = async (
  organizationId: string,
  productId: string,
  sellingPrice: number
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('establishment_products')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        selling_price: sellingPrice,
        is_active: true
      });

    if (error) {
      console.error('Error adding establishment product:', error);
      return {
        success: false,
        error: error.message || 'Failed to add product'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in addEstablishmentProduct:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Update an establishment product (price or active status)
 */
export const updateEstablishmentProduct = async (
  id: string,
  updates: { sellingPrice?: number; isActive?: boolean }
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const dbUpdates: Record<string, any> = {};

    if (updates.sellingPrice !== undefined) {
      dbUpdates.selling_price = updates.sellingPrice;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }

    const { error } = await supabase
      .from('establishment_products')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating establishment product:', error);
      return {
        success: false,
        error: error.message || 'Failed to update product'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in updateEstablishmentProduct:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Delete an establishment product
 */
export const deleteEstablishmentProduct = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('establishment_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting establishment product:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete product'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in deleteEstablishmentProduct:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get all configured establishment products (including inactive)
 */
export const getAllEstablishmentProducts = async (
  organizationId: string
): Promise<{ data: EstablishmentProduct[] | null; error: string | null }> => {
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
        product:products(id, name, reference, brand, category, crate_type, crate_price, image_url)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all establishment products:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch products'
      };
    }

    return {
      data: (data || []).map(mapEstablishmentProduct),
      error: null
    };
  } catch (err: any) {
    console.error('Error in getAllEstablishmentProducts:', err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Add a product to the daily sheet tracking
 * Creates an entry in establishment_products (if not exists) + daily_stock_lines
 */
export const addProductToDailySheet = async (
  organizationId: string,
  dailySheetId: string,
  productId: string,
  initialStock: number,
  sellingPrice: number
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // First, upsert into establishment_products
    const { error: estError } = await supabase
      .from('establishment_products')
      .upsert({
        organization_id: organizationId,
        product_id: productId,
        selling_price: sellingPrice,
        is_active: true
      }, {
        onConflict: 'organization_id,product_id'
      });

    if (estError) {
      console.error('Error upserting establishment product:', estError);
      return {
        success: false,
        error: estError.message || 'Failed to configure product'
      };
    }

    // Then, insert into daily_stock_lines
    const { error: stockError } = await supabase
      .from('daily_stock_lines')
      .insert({
        daily_sheet_id: dailySheetId,
        product_id: productId,
        initial_stock: initialStock,
        ravito_supply: 0,
        external_supply: 0
      });

    if (stockError) {
      console.error('Error adding stock line:', stockError);
      return {
        success: false,
        error: stockError.message || 'Failed to add product to daily tracking'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in addProductToDailySheet:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Remove a product from the daily sheet tracking
 * Deletes the entry from daily_stock_lines
 */
export const removeProductFromDailySheet = async (
  stockLineId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('daily_stock_lines')
      .delete()
      .eq('id', stockLineId);

    if (error) {
      console.error('Error removing stock line:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove product'
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in removeProductFromDailySheet:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    };
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
  creditSales: data.credit_sales || 0,           // ✅ AJOUTÉ
  creditPayments: data.credit_payments || 0,     // ✅ AJOUTÉ
  creditBalanceEod: data.credit_balance_eod,     // ✅ AJOUTÉ
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
  qtyConsignesPaid: data.qty_consignes_paid || 0,
  qtyFullEnd: data.qty_full_end,
  qtyEmptyEnd: data.qty_empty_end,
  notes: data.notes || '',
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

/**
 * Maps raw database EstablishmentProduct to camelCase format
 * Note: Uses 'any' type for raw DB response to match existing pattern in this file
 * The nested 'product' field is kept as-is for UI compatibility
 */
const mapEstablishmentProduct = (data: any): EstablishmentProduct => ({
  id: data.id,
  organizationId: data.organization_id,
  productId: data.product_id,
  sellingPrice: data.selling_price,
  isActive: data.is_active ?? true,
  minStockAlert: data.min_stock_alert || 0,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  product: data.product as any // Keep as-is for UI compatibility
});