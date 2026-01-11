import { supabase } from '../lib/supabase';
import {
  DailySheet,
  DailyStockLine,
  DailyPackaging,
  DailyExpense,
  EstablishmentProduct,
  UpdateStockLineData,
  UpdatePackagingData,
  AddExpenseData,
  CloseSheetData,
  UpsertEstablishmentProductData,
} from '../types/activity';

// ============================================
// DAILY SHEET OPERATIONS
// ============================================

/**
 * Get or create daily sheet for a specific date
 */
export async function getOrCreateDailySheet(
  organizationId: string,
  date: string // YYYY-MM-DD format
): Promise<{ data: DailySheet | null; error: string | null }> {
  try {
    // Try to get existing sheet
    const { data: existingSheet, error: fetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sheet_date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine
      console.error('Error fetching daily sheet:', fetchError);
      return { data: null, error: fetchError.message };
    }

    if (existingSheet) {
      return {
        data: {
          id: existingSheet.id,
          organizationId: existingSheet.organization_id,
          sheetDate: existingSheet.sheet_date,
          status: existingSheet.status,
          openingCash: existingSheet.opening_cash,
          closingCash: existingSheet.closing_cash,
          theoreticalRevenue: existingSheet.theoretical_revenue,
          cashDifference: existingSheet.cash_difference,
          expensesTotal: existingSheet.expenses_total,
          notes: existingSheet.notes,
          closedAt: existingSheet.closed_at,
          closedBy: existingSheet.closed_by,
          createdAt: existingSheet.created_at,
          updatedAt: existingSheet.updated_at,
        },
        error: null,
      };
    }

    // Create new sheet with carryover function
    const { data: newSheetId, error: createError } = await supabase
      .rpc('create_daily_sheet_with_carryover', {
        p_organization_id: organizationId,
        p_date: date,
      });

    if (createError) {
      console.error('Error creating daily sheet:', createError);
      return { data: null, error: createError.message };
    }

    // Fetch the newly created sheet
    const { data: newSheet, error: newFetchError } = await supabase
      .from('daily_sheets')
      .select('*')
      .eq('id', newSheetId)
      .single();

    if (newFetchError) {
      console.error('Error fetching new daily sheet:', newFetchError);
      return { data: null, error: newFetchError.message };
    }

    return {
      data: {
        id: newSheet.id,
        organizationId: newSheet.organization_id,
        sheetDate: newSheet.sheet_date,
        status: newSheet.status,
        openingCash: newSheet.opening_cash,
        closingCash: newSheet.closing_cash,
        theoreticalRevenue: newSheet.theoretical_revenue,
        cashDifference: newSheet.cash_difference,
        expensesTotal: newSheet.expenses_total,
        notes: newSheet.notes,
        closedAt: newSheet.closed_at,
        closedBy: newSheet.closed_by,
        createdAt: newSheet.created_at,
        updatedAt: newSheet.updated_at,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error in getOrCreateDailySheet:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

// ============================================
// STOCK LINES OPERATIONS
// ============================================

/**
 * Get daily stock lines with product details
 */
export async function getDailyStockLines(
  sheetId: string
): Promise<{ data: DailyStockLine[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_stock_lines')
      .select(`
        *,
        product:products(*)
      `)
      .eq('daily_sheet_id', sheetId)
      .order('product(name)', { ascending: true });

    if (error) {
      console.error('Error fetching stock lines:', error);
      return { data: null, error: error.message };
    }

    const stockLines: DailyStockLine[] = data.map((line: any) => ({
      id: line.id,
      dailySheetId: line.daily_sheet_id,
      productId: line.product_id,
      initialStock: line.initial_stock,
      ravitoSupply: line.ravito_supply,
      externalSupply: line.external_supply,
      finalStock: line.final_stock,
      createdAt: line.created_at,
      updatedAt: line.updated_at,
      product: line.product ? {
        id: line.product.id,
        reference: line.product.reference,
        name: line.product.name,
        category: line.product.category,
        brand: line.product.brand,
        crateType: line.product.crate_type,
        unitPrice: line.product.unit_price,
        cratePrice: line.product.crate_price,
        consignPrice: line.product.consign_price,
        description: line.product.description,
        alcoholContent: line.product.alcohol_content,
        volume: line.product.volume,
        isActive: line.product.is_active,
        imageUrl: line.product.image_url,
        createdAt: line.product.created_at,
        updatedAt: line.product.updated_at,
      } : undefined,
    }));

    return { data: stockLines, error: null };
  } catch (error: any) {
    console.error('Unexpected error in getDailyStockLines:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Update a stock line
 */
export async function updateStockLine(
  lineId: string,
  updates: UpdateStockLineData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: any = {};
    if (updates.externalSupply !== undefined) {
      updateData.external_supply = updates.externalSupply;
    }
    if (updates.finalStock !== undefined) {
      updateData.final_stock = updates.finalStock;
    }

    const { error } = await supabase
      .from('daily_stock_lines')
      .update(updateData)
      .eq('id', lineId);

    if (error) {
      console.error('Error updating stock line:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected error in updateStockLine:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// ============================================
// PACKAGING OPERATIONS
// ============================================

/**
 * Get daily packaging tracking
 */
export async function getDailyPackaging(
  sheetId: string
): Promise<{ data: DailyPackaging[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_packaging')
      .select('*')
      .eq('daily_sheet_id', sheetId)
      .order('crate_type', { ascending: true });

    if (error) {
      console.error('Error fetching daily packaging:', error);
      return { data: null, error: error.message };
    }

    const packaging: DailyPackaging[] = data.map((pkg: any) => ({
      id: pkg.id,
      dailySheetId: pkg.daily_sheet_id,
      crateType: pkg.crate_type,
      qtyFullStart: pkg.qty_full_start,
      qtyEmptyStart: pkg.qty_empty_start,
      qtyReceived: pkg.qty_received,
      qtyReturned: pkg.qty_returned,
      qtyFullEnd: pkg.qty_full_end,
      qtyEmptyEnd: pkg.qty_empty_end,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
    }));

    return { data: packaging, error: null };
  } catch (error: any) {
    console.error('Unexpected error in getDailyPackaging:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Update packaging quantities
 */
export async function updatePackaging(
  packagingId: string,
  updates: UpdatePackagingData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: any = {};
    if (updates.qtyFullEnd !== undefined) {
      updateData.qty_full_end = updates.qtyFullEnd;
    }
    if (updates.qtyEmptyEnd !== undefined) {
      updateData.qty_empty_end = updates.qtyEmptyEnd;
    }

    const { error } = await supabase
      .from('daily_packaging')
      .update(updateData)
      .eq('id', packagingId);

    if (error) {
      console.error('Error updating packaging:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected error in updatePackaging:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// ============================================
// EXPENSES OPERATIONS
// ============================================

/**
 * Get daily expenses
 */
export async function getDailyExpenses(
  sheetId: string
): Promise<{ data: DailyExpense[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('daily_sheet_id', sheetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching daily expenses:', error);
      return { data: null, error: error.message };
    }

    const expenses: DailyExpense[] = data.map((exp: any) => ({
      id: exp.id,
      dailySheetId: exp.daily_sheet_id,
      label: exp.label,
      amount: exp.amount,
      category: exp.category,
      createdAt: exp.created_at,
    }));

    return { data: expenses, error: null };
  } catch (error: any) {
    console.error('Unexpected error in getDailyExpenses:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Add a new expense
 */
export async function addExpense(
  sheetId: string,
  expenseData: AddExpenseData
): Promise<{ data: DailyExpense | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_expenses')
      .insert({
        daily_sheet_id: sheetId,
        label: expenseData.label,
        amount: expenseData.amount,
        category: expenseData.category,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return { data: null, error: error.message };
    }

    // Update expenses_total in daily_sheet
    await updateExpensesTotal(sheetId);

    return {
      data: {
        id: data.id,
        dailySheetId: data.daily_sheet_id,
        label: data.label,
        amount: data.amount,
        category: data.category,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error in addExpense:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(
  expenseId: string,
  sheetId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: error.message };
    }

    // Update expenses_total in daily_sheet
    await updateExpensesTotal(sheetId);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected error in deleteExpense:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Helper: Update expenses total in daily sheet
 */
async function updateExpensesTotal(sheetId: string): Promise<void> {
  try {
    const { data: expenses } = await supabase
      .from('daily_expenses')
      .select('amount')
      .eq('daily_sheet_id', sheetId);

    const total = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

    await supabase
      .from('daily_sheets')
      .update({ expenses_total: total })
      .eq('id', sheetId);
  } catch (error) {
    console.error('Error updating expenses total:', error);
  }
}

// ============================================
// SHEET CLOSURE
// ============================================

/**
 * Close the daily sheet
 */
export async function closeDailySheet(
  sheetId: string,
  closeData: CloseSheetData,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get the sheet to calculate theoretical revenue
    const { data: stockLines } = await getDailyStockLines(sheetId);
    const { data: sheet } = await supabase
      .from('daily_sheets')
      .select('*, organization_id')
      .eq('id', sheetId)
      .single();

    if (!sheet || !stockLines) {
      return { success: false, error: 'Sheet or stock lines not found' };
    }

    // Calculate theoretical revenue from stock lines
    const { data: establishmentProducts } = await getEstablishmentProducts(sheet.organization_id);
    
    let theoreticalRevenue = 0;
    if (establishmentProducts) {
      stockLines.forEach((line) => {
        if (line.finalStock !== null && line.finalStock !== undefined) {
          const totalSupply = line.ravitoSupply + line.externalSupply;
          const salesQty = line.initialStock + totalSupply - line.finalStock;
          
          if (salesQty > 0) {
            const estProduct = establishmentProducts.find(ep => ep.productId === line.productId);
            if (estProduct) {
              theoreticalRevenue += salesQty * estProduct.sellingPrice;
            }
          }
        }
      });
    }

    // Calculate cash difference
    const cashDifference = closeData.closingCash - (sheet.opening_cash + theoreticalRevenue - sheet.expenses_total);

    // Update the sheet
    const { error } = await supabase
      .from('daily_sheets')
      .update({
        status: 'closed',
        closing_cash: closeData.closingCash,
        theoretical_revenue: theoreticalRevenue,
        cash_difference: cashDifference,
        notes: closeData.notes || null,
        closed_at: new Date().toISOString(),
        closed_by: userId,
      })
      .eq('id', sheetId);

    if (error) {
      console.error('Error closing daily sheet:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected error in closeDailySheet:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// ============================================
// SYNC RAVITO DELIVERIES
// ============================================

/**
 * Sync RAVITO deliveries to daily sheet
 */
export async function syncRavitoDeliveries(
  sheetId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .rpc('sync_ravito_deliveries_to_daily_sheet', {
        p_sheet_id: sheetId,
      });

    if (error) {
      console.error('Error syncing RAVITO deliveries:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected error in syncRavitoDeliveries:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// ============================================
// ESTABLISHMENT PRODUCTS
// ============================================

/**
 * Get establishment products (selling prices)
 */
export async function getEstablishmentProducts(
  organizationId: string
): Promise<{ data: EstablishmentProduct[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('establishment_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('organization_id', organizationId)
      .order('product(name)', { ascending: true });

    if (error) {
      console.error('Error fetching establishment products:', error);
      return { data: null, error: error.message };
    }

    const products: EstablishmentProduct[] = data.map((ep: any) => ({
      id: ep.id,
      organizationId: ep.organization_id,
      productId: ep.product_id,
      sellingPrice: ep.selling_price,
      isActive: ep.is_active,
      minStockAlert: ep.min_stock_alert,
      createdAt: ep.created_at,
      updatedAt: ep.updated_at,
      product: ep.product ? {
        id: ep.product.id,
        reference: ep.product.reference,
        name: ep.product.name,
        category: ep.product.category,
        brand: ep.product.brand,
        crateType: ep.product.crate_type,
        unitPrice: ep.product.unit_price,
        cratePrice: ep.product.crate_price,
        consignPrice: ep.product.consign_price,
        description: ep.product.description,
        alcoholContent: ep.product.alcohol_content,
        volume: ep.product.volume,
        isActive: ep.product.is_active,
        imageUrl: ep.product.image_url,
        createdAt: ep.product.created_at,
        updatedAt: ep.product.updated_at,
      } : undefined,
    }));

    return { data: products, error: null };
  } catch (error: any) {
    console.error('Unexpected error in getEstablishmentProducts:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Upsert (create or update) establishment product
 */
export async function upsertEstablishmentProduct(
  productData: UpsertEstablishmentProductData
): Promise<{ data: EstablishmentProduct | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('establishment_products')
      .upsert({
        organization_id: productData.organizationId,
        product_id: productData.productId,
        selling_price: productData.sellingPrice,
        is_active: productData.isActive !== undefined ? productData.isActive : true,
        min_stock_alert: productData.minStockAlert || 0,
      }, {
        onConflict: 'organization_id,product_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting establishment product:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        organizationId: data.organization_id,
        productId: data.product_id,
        sellingPrice: data.selling_price,
        isActive: data.is_active,
        minStockAlert: data.min_stock_alert,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error in upsertEstablishmentProduct:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}
