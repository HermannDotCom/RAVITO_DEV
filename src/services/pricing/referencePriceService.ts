/**
 * Service de prix de référence - Version simplifiée
 * Les prix de référence sont maintenant stockés directement dans la table products
 */

import { supabase } from '../../lib/supabase';

/**
 * Interface ReferencePrice - Mappage de la table products
 * Cette interface maintient la compatibilité avec l'ancien code tout en lisant
 * directement depuis la table products.
 * 
 * @property id - ID du produit (utilisé aussi comme productId)
 * @property productId - ID du produit (même valeur que id)
 * @property zoneId - Paramètre optionnel maintenu pour compatibilité API (non utilisé en base)
 * @property referenceUnitPrice - Prix unitaire depuis products.unit_price
 * @property referenceCratePrice - Prix casier depuis products.crate_price
 * @property referenceConsignPrice - Prix consigne depuis products.consign_price
 * @property isActive - État actif depuis products.is_active
 * @property createdAt - Date de création depuis products.created_at
 * @property updatedAt - Date de mise à jour depuis products.updated_at
 */
export interface ReferencePrice {
  id: string;
  productId: string;
  zoneId?: string;
  referenceUnitPrice: number;
  referenceCratePrice: number;
  referenceConsignPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Récupère le prix de référence pour un produit depuis la table products
 * 
 * @param productId - ID du produit
 * @param zoneId - Paramètre optionnel maintenu pour compatibilité API (non utilisé)
 * @returns ReferencePrice ou null si non trouvé
 */
export async function getActiveReferencePrice(
  productId: string,
  zoneId?: string
): Promise<ReferencePrice | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, unit_price, crate_price, consign_price, is_active, created_at, updated_at')
      .eq('id', productId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      productId: data.id,
      zoneId: zoneId,
      referenceUnitPrice: data.unit_price,
      referenceCratePrice: data.crate_price,
      referenceConsignPrice: data.consign_price,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('Error fetching reference price:', error);
    return null;
  }
}

/**
 * Récupère tous les prix de référence (tous les produits actifs)
 * Note: Retourne un tableau vide en cas d'erreur au lieu de lever une exception.
 * 
 * @param filters - Filtres optionnels (isActive, productId)
 * @returns Tableau de ReferencePrice (vide en cas d'erreur)
 */
export async function getReferencePrices(filters?: {
  isActive?: boolean;
  productId?: string;
}): Promise<ReferencePrice[]> {
  try {
    let query = supabase
      .from('products')
      .select('id, unit_price, crate_price, consign_price, is_active, created_at, updated_at')
      .order('name');

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.productId) {
      query = query.eq('id', filters.productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reference prices:', error);
      return [];
    }

    return (data || []).map(product => ({
      id: product.id,
      productId: product.id,
      referenceUnitPrice: product.unit_price,
      referenceCratePrice: product.crate_price,
      referenceConsignPrice: product.consign_price,
      isActive: product.is_active,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    }));
  } catch (error) {
    console.error('Error fetching reference prices:', error);
    return [];
  }
}

/**
 * Récupère le prix de référence simplifié (nouvelle méthode recommandée)
 * Note: Retourne null en cas d'erreur au lieu de lever une exception.
 * 
 * @param productId - ID du produit
 * @returns Objet avec les prix ou null si non trouvé/erreur
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
