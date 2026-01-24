/**
 * Service de gestion des prix de référence RAVITO
 * Réservé aux administrateurs pour définir les prix de référence par zone
 */

import { supabase } from '../../lib/supabase';
import { FEATURE_FLAGS } from '../../config/featureFlags';

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
 * Lit maintenant depuis la table 'products' au lieu de 'reference_prices'
 */
export async function getReferencePrices(filters?: {
  productId?: string;
  zoneId?: string;  // Gardé pour compatibilité, mais ignoré car products n'a pas de zone
  categoryId?: string;  // Gardé pour compatibilité, mais ignoré car products n'a pas de categoryId
  isActive?: boolean;
}): Promise<ReferencePrice[]> {
  try {
    // Lire depuis products au lieu de reference_prices
    let query = supabase
      .from('products')
      .select('*')
      .order('name');

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.productId) {
      query = query.eq('id', filters.productId);
    }
    // Note: zoneId et categoryId sont ignorés car la table products ne les contient pas

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reference prices:', error);
      throw error;
    }

    // Mapper vers le format ReferencePrice pour compatibilité
    return (data || []).map(product => ({
      id: product.id,
      productId: product.id,
      zoneId: undefined,
      categoryId: undefined,
      referenceUnitPrice: product.unit_price,
      referenceCratePrice: product.crate_price,
      referenceConsignPrice: product.consign_price,
      effectiveFrom: product.created_at ? new Date(product.created_at) : new Date(),
      effectiveTo: undefined,
      isActive: product.is_active,
      createdBy: undefined,
      updatedBy: undefined,
      createdAt: product.created_at ? new Date(product.created_at) : new Date(),
      updatedAt: product.updated_at ? new Date(product.updated_at) : new Date(),
    }));
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
 * @deprecated Utiliser getReferencePriceFromProduct() à la place.
 * Cette fonction est maintenue pour compatibilité mais sera supprimée en Phase 4.
 * 
 * Récupère le prix de référence actif pour un produit.
 * Lit maintenant depuis la table 'products' au lieu de 'reference_prices'.
 */
export async function getActiveReferencePrice(
  productId: string,
  zoneId?: string  // Gardé pour compatibilité, mais ignoré
): Promise<ReferencePrice | null> {
  try {
    // Utiliser le feature flag pour déterminer la source
    if (FEATURE_FLAGS.USE_PRODUCTS_AS_REFERENCE_SOURCE) {
      // Nouvelle logique : lire depuis products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, unit_price, crate_price, consign_price, is_active, created_at, updated_at')
        .eq('id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (!productError && productData) {
        // Retourner au format ReferencePrice pour compatibilité
        return {
          id: productData.id,
          productId: productData.id,
          zoneId: zoneId,
          referenceUnitPrice: productData.unit_price,
          referenceCratePrice: productData.crate_price,
          referenceConsignPrice: productData.consign_price,
          isActive: productData.is_active,
          createdAt: new Date(productData.created_at),
          updatedAt: new Date(productData.updated_at),
        } as ReferencePrice;
      }
    }

    // Ancien comportement ou fallback
    const { data, error } = await supabase.rpc('get_reference_price', {
      p_product_id: productId,
      p_zone_id: zoneId || null
    });

    if (error) {
      console.error('Error fetching reference price:', error);
      return null;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    const priceData = Array.isArray(data) ? data[0] : data;
    return {
      id: '',
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
    return null;
  }
}

/**
 * Récupère le prix de référence directement depuis la table products
 * C'est la nouvelle méthode recommandée (plus simple, une seule source)
 */
export async function getReferencePriceFromProduct(
  productId: string
): Promise<{ unitPrice: number; cratePrice: number; consignPrice: number } | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('unit_price, crate_price, consign_price')
      .eq('id', productId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      unitPrice: data.unit_price,
      cratePrice: data.crate_price,
      consignPrice: data.consign_price,
    };
  } catch (error) {
    console.error('Error fetching price from product:', error);
    return null;
  }
}

/**
 * @deprecated Les fonctions CRUD sur reference_prices seront supprimées en Phase 4.
 * Utiliser les services de productAdminService.ts pour gérer les produits et leurs prix.
 * 
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
 * @deprecated Les fonctions CRUD sur reference_prices seront supprimées en Phase 4.
 * Utiliser les services de productAdminService.ts pour gérer les produits et leurs prix.
 * 
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
 * @deprecated Les fonctions CRUD sur reference_prices seront supprimées en Phase 4.
 * Utiliser les services de productAdminService.ts pour gérer les produits et leurs prix.
 * 
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
 * @deprecated Les fonctions CRUD sur reference_prices seront supprimées en Phase 4.
 * Utiliser les services de productAdminService.ts pour gérer les produits et leurs prix.
 * 
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
 * @deprecated Les fonctions CRUD sur reference_prices seront supprimées en Phase 4.
 * Utiliser les services de productAdminService.ts pour gérer les produits et leurs prix.
 * 
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
