/**
 * Service de gestion des grilles tarifaires fournisseur
 * Permet aux fournisseurs de gérer leurs prix personnalisés
 */

import { supabase } from '../../lib/supabase';

export interface SupplierPriceGrid {
  id: string;
  supplierId: string;
  productId: string;
  zoneId?: string;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number;
  discountPercentage: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierPriceGridHistory {
  id: string;
  gridId: string;
  supplierId: string;
  productId: string;
  oldUnitPrice?: number;
  newUnitPrice?: number;
  oldCratePrice?: number;
  newCratePrice?: number;
  oldConsignPrice?: number;
  newConsignPrice?: number;
  changeType: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  changeReason?: string;
  changedBy?: string;
  changedAt: Date;
}

export interface CreateSupplierPriceGridInput {
  productId: string;
  zoneId?: string;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  discountPercentage?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  notes?: string;
}

export interface UpdateSupplierPriceGridInput {
  unitPrice?: number;
  cratePrice?: number;
  consignPrice?: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  discountPercentage?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
  notes?: string;
}

/**
 * Récupère les grilles tarifaires d'un fournisseur
 */
export async function getSupplierPriceGrids(
  supplierId?: string,
  filters?: {
    productId?: string;
    zoneId?: string;
    isActive?: boolean;
  }
): Promise<SupplierPriceGrid[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Si pas de supplierId fourni, utiliser l'utilisateur courant
    const targetSupplierId = supplierId || user?.id;
    
    if (!targetSupplierId) {
      throw new Error('Supplier ID required');
    }

    let query = supabase
      .from('supplier_price_grids')
      .select('*')
      .eq('supplier_id', targetSupplierId)
      .order('created_at', { ascending: false });

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }
    if (filters?.zoneId) {
      query = query.eq('zone_id', filters.zoneId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching supplier price grids:', error);
      throw error;
    }

    return (data || []).map(mapSupplierPriceGridFromDb);
  } catch (error) {
    console.error('Exception in getSupplierPriceGrids:', error);
    throw error;
  }
}

/**
 * Récupère une grille tarifaire spécifique
 */
export async function getSupplierPriceGrid(id: string): Promise<SupplierPriceGrid | null> {
  try {
    const { data, error } = await supabase
      .from('supplier_price_grids')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier price grid:', error);
      throw error;
    }

    return data ? mapSupplierPriceGridFromDb(data) : null;
  } catch (error) {
    console.error('Exception in getSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Récupère la grille active pour un fournisseur/produit/zone
 * Note: This uses an RPC function that returns price data but not the full record.
 * For full record access with ID, use getSupplierPriceGrids() with filters instead.
 */
export async function getActiveSupplierPriceGrid(
  supplierId: string,
  productId: string,
  zoneId?: string
): Promise<SupplierPriceGrid | null> {
  try {
    // Try to fetch the full record first
    const grids = await getSupplierPriceGrids(supplierId, {
      productId,
      zoneId,
      isActive: true,
    });

    if (grids.length > 0) {
      // Return the most recent active grid
      return grids[0];
    }

    // Fallback to RPC if direct query doesn't work
    const { data, error } = await supabase.rpc('get_supplier_price_grid', {
      p_supplier_id: supplierId,
      p_product_id: productId,
      p_zone_id: zoneId || null
    });

    if (error) {
      console.error('Error fetching active supplier price grid:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // RPC returns limited data without ID - construct a minimal object
    const priceData = Array.isArray(data) ? data[0] : data;
    return {
      id: '', // Note: ID not available from RPC, use getSupplierPriceGrids for full record
      supplierId,
      productId,
      zoneId,
      unitPrice: priceData.unit_price,
      cratePrice: priceData.crate_price,
      consignPrice: priceData.consign_price,
      discountPercentage: priceData.discount_percentage,
      minimumOrderQuantity: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SupplierPriceGrid;
  } catch (error) {
    console.error('Exception in getActiveSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle grille tarifaire
 */
export async function createSupplierPriceGrid(
  input: CreateSupplierPriceGridInput
): Promise<SupplierPriceGrid> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('supplier_price_grids')
      .insert({
        supplier_id: user.id,
        product_id: input.productId,
        zone_id: input.zoneId,
        unit_price: input.unitPrice,
        crate_price: input.cratePrice,
        consign_price: input.consignPrice,
        minimum_order_quantity: input.minimumOrderQuantity || 1,
        maximum_order_quantity: input.maximumOrderQuantity,
        discount_percentage: input.discountPercentage || 0,
        effective_from: input.effectiveFrom?.toISOString() || new Date().toISOString(),
        effective_to: input.effectiveTo?.toISOString(),
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier price grid:', error);
      throw error;
    }

    return mapSupplierPriceGridFromDb(data);
  } catch (error) {
    console.error('Exception in createSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Met à jour une grille tarifaire
 */
export async function updateSupplierPriceGrid(
  id: string,
  input: UpdateSupplierPriceGridInput
): Promise<SupplierPriceGrid> {
  try {
    const updateData: any = {};

    if (input.unitPrice !== undefined) {
      updateData.unit_price = input.unitPrice;
    }
    if (input.cratePrice !== undefined) {
      updateData.crate_price = input.cratePrice;
    }
    if (input.consignPrice !== undefined) {
      updateData.consign_price = input.consignPrice;
    }
    if (input.minimumOrderQuantity !== undefined) {
      updateData.minimum_order_quantity = input.minimumOrderQuantity;
    }
    if (input.maximumOrderQuantity !== undefined) {
      updateData.maximum_order_quantity = input.maximumOrderQuantity;
    }
    if (input.discountPercentage !== undefined) {
      updateData.discount_percentage = input.discountPercentage;
    }
    if (input.effectiveFrom !== undefined) {
      updateData.effective_from = input.effectiveFrom.toISOString();
    }
    if (input.effectiveTo !== undefined) {
      updateData.effective_to = input.effectiveTo.toISOString();
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    const { data, error } = await supabase
      .from('supplier_price_grids')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier price grid:', error);
      throw error;
    }

    return mapSupplierPriceGridFromDb(data);
  } catch (error) {
    console.error('Exception in updateSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Désactive une grille tarifaire
 */
export async function deactivateSupplierPriceGrid(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('supplier_price_grids')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating supplier price grid:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deactivateSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Supprime une grille tarifaire
 */
export async function deleteSupplierPriceGrid(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('supplier_price_grids')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier price grid:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteSupplierPriceGrid:', error);
    throw error;
  }
}

/**
 * Récupère l'historique des modifications d'une grille
 */
export async function getSupplierPriceGridHistory(
  gridId?: string,
  supplierId?: string
): Promise<SupplierPriceGridHistory[]> {
  try {
    let query = supabase
      .from('supplier_price_grid_history')
      .select('*')
      .order('changed_at', { ascending: false });

    if (gridId) {
      query = query.eq('grid_id', gridId);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching price grid history:', error);
      throw error;
    }

    return (data || []).map(mapSupplierPriceGridHistoryFromDb);
  } catch (error) {
    console.error('Exception in getSupplierPriceGridHistory:', error);
    throw error;
  }
}

/**
 * Import en masse de grilles tarifaires
 */
export async function bulkCreateSupplierPriceGrids(
  grids: CreateSupplierPriceGridInput[]
): Promise<{ success: number; errors: number; errorDetails: any[] }> {
  const results = {
    success: 0,
    errors: 0,
    errorDetails: [] as any[]
  };

  for (const grid of grids) {
    try {
      await createSupplierPriceGrid(grid);
      results.success++;
    } catch (error) {
      results.errors++;
      results.errorDetails.push({
        grid,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Map database row to SupplierPriceGrid
 */
function mapSupplierPriceGridFromDb(data: any): SupplierPriceGrid {
  return {
    id: data.id,
    supplierId: data.supplier_id,
    productId: data.product_id,
    zoneId: data.zone_id,
    unitPrice: data.unit_price,
    cratePrice: data.crate_price,
    consignPrice: data.consign_price,
    minimumOrderQuantity: data.minimum_order_quantity,
    maximumOrderQuantity: data.maximum_order_quantity,
    discountPercentage: data.discount_percentage,
    effectiveFrom: new Date(data.effective_from),
    effectiveTo: data.effective_to ? new Date(data.effective_to) : undefined,
    isActive: data.is_active,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Map database row to SupplierPriceGridHistory
 */
function mapSupplierPriceGridHistoryFromDb(data: any): SupplierPriceGridHistory {
  return {
    id: data.id,
    gridId: data.grid_id,
    supplierId: data.supplier_id,
    productId: data.product_id,
    oldUnitPrice: data.old_unit_price,
    newUnitPrice: data.new_unit_price,
    oldCratePrice: data.old_crate_price,
    newCratePrice: data.new_crate_price,
    oldConsignPrice: data.old_consign_price,
    newConsignPrice: data.new_consign_price,
    changeType: data.change_type,
    changeReason: data.change_reason,
    changedBy: data.changed_by,
    changedAt: new Date(data.changed_at),
  };
}
