/**
 * Service de gestion des prix de référence RAVITO
 * Réservé aux administrateurs pour définir les prix de référence par zone
 */

import { supabase } from '../../lib/supabase';

export interface ReferencePrice {
  id: string;
  productId: string;
  zoneId?: string;
  categoryId?: string;
  referenceUnitPrice: number;
  referenceCratePrice: number;
  referenceConsignPrice: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReferencePriceInput {
  productId: string;
  zoneId?: string;
  categoryId?: string;
  referenceUnitPrice: number;
  referenceCratePrice: number;
  referenceConsignPrice: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdateReferencePriceInput {
  referenceUnitPrice?: number;
  referenceCratePrice?: number;
  referenceConsignPrice?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

/**
 * Récupère tous les prix de référence avec filtres optionnels
 */
export async function getReferencePrices(filters?: {
  productId?: string;
  zoneId?: string;
  categoryId?: string;
  isActive?: boolean;
}): Promise<ReferencePrice[]> {
  try {
    let query = supabase
      .from('reference_prices')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }
    if (filters?.zoneId) {
      query = query.eq('zone_id', filters.zoneId);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reference prices:', error);
      throw error;
    }

    return (data || []).map(mapReferencePriceFromDb);
  } catch (error) {
    console.error('Exception in getReferencePrices:', error);
    throw error;
  }
}

/**
 * Récupère un prix de référence spécifique
 */
export async function getReferencePrice(id: string): Promise<ReferencePrice | null> {
  try {
    const { data, error } = await supabase
      .from('reference_prices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reference price:', error);
      throw error;
    }

    return data ? mapReferencePriceFromDb(data) : null;
  } catch (error) {
    console.error('Exception in getReferencePrice:', error);
    throw error;
  }
}

/**
 * Récupère le prix de référence actif pour un produit/zone
 */
export async function getActiveReferencePrice(
  productId: string,
  zoneId?: string
): Promise<ReferencePrice | null> {
  try {
    const { data, error } = await supabase.rpc('get_reference_price', {
      p_product_id: productId,
      p_zone_id: zoneId || null
    });

    if (error) {
      console.error('Error fetching active reference price:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Retourner le premier résultat avec les données structurées
    const priceData = Array.isArray(data) ? data[0] : data;
    return {
      id: '', // Non retourné par la fonction RPC
      productId,
      zoneId,
      referenceUnitPrice: priceData.unit_price,
      referenceCratePrice: priceData.crate_price,
      referenceConsignPrice: priceData.consign_price,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ReferencePrice;
  } catch (error) {
    console.error('Exception in getActiveReferencePrice:', error);
    throw error;
  }
}

/**
 * Crée un nouveau prix de référence
 */
export async function createReferencePrice(
  input: CreateReferencePriceInput
): Promise<ReferencePrice> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reference_prices')
      .insert({
        product_id: input.productId,
        zone_id: input.zoneId,
        category_id: input.categoryId,
        reference_unit_price: input.referenceUnitPrice,
        reference_crate_price: input.referenceCratePrice,
        reference_consign_price: input.referenceConsignPrice,
        effective_from: input.effectiveFrom || new Date().toISOString(),
        effective_to: input.effectiveTo?.toISOString(),
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reference price:', error);
      throw error;
    }

    return mapReferencePriceFromDb(data);
  } catch (error) {
    console.error('Exception in createReferencePrice:', error);
    throw error;
  }
}

/**
 * Met à jour un prix de référence existant
 */
export async function updateReferencePrice(
  id: string,
  input: UpdateReferencePriceInput
): Promise<ReferencePrice> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: any = {
      updated_by: user?.id,
    };

    if (input.referenceUnitPrice !== undefined) {
      updateData.reference_unit_price = input.referenceUnitPrice;
    }
    if (input.referenceCratePrice !== undefined) {
      updateData.reference_crate_price = input.referenceCratePrice;
    }
    if (input.referenceConsignPrice !== undefined) {
      updateData.reference_consign_price = input.referenceConsignPrice;
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

    const { data, error } = await supabase
      .from('reference_prices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reference price:', error);
      throw error;
    }

    return mapReferencePriceFromDb(data);
  } catch (error) {
    console.error('Exception in updateReferencePrice:', error);
    throw error;
  }
}

/**
 * Désactive un prix de référence
 */
export async function deactivateReferencePrice(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reference_prices')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating reference price:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deactivateReferencePrice:', error);
    throw error;
  }
}

/**
 * Supprime un prix de référence
 */
export async function deleteReferencePrice(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reference_prices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reference price:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteReferencePrice:', error);
    throw error;
  }
}

/**
 * Import en masse de prix de référence (pour Excel import)
 */
export async function bulkCreateReferencePrices(
  prices: CreateReferencePriceInput[]
): Promise<{ success: number; errors: number; errorDetails: any[] }> {
  const results = {
    success: 0,
    errors: 0,
    errorDetails: [] as any[]
  };

  for (const price of prices) {
    try {
      await createReferencePrice(price);
      results.success++;
    } catch (error) {
      results.errors++;
      results.errorDetails.push({
        price,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Map database row to ReferencePrice interface
 */
function mapReferencePriceFromDb(data: any): ReferencePrice {
  return {
    id: data.id,
    productId: data.product_id,
    zoneId: data.zone_id,
    categoryId: data.category_id,
    referenceUnitPrice: data.reference_unit_price,
    referenceCratePrice: data.reference_crate_price,
    referenceConsignPrice: data.reference_consign_price,
    effectiveFrom: new Date(data.effective_from),
    effectiveTo: data.effective_to ? new Date(data.effective_to) : undefined,
    isActive: data.is_active,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
