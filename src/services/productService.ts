import { supabase } from '../lib/supabase';
import { Product, ProductCategory } from '../types';

export async function getProducts(filters?: {
  category?: ProductCategory;
  brand?: string;
  isActive?: boolean;
}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.brand) {
      query = query.eq('brand', filters.brand);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map(mapDatabaseProductToApp);
  } catch (error) {
    console.error('Exception fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data ? mapDatabaseProductToApp(data) : null;
  } catch (error) {
    console.error('Exception fetching product:', error);
    return null;
  }
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error fetching products by ids:', error);
      return [];
    }

    return data.map(mapDatabaseProductToApp);
  } catch (error) {
    console.error('Exception fetching products by ids:', error);
    return [];
  }
}

export async function getUniqueBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    const brands = Array.from(new Set(data.map(p => p.brand))).sort();
    return brands;
  } catch (error) {
    console.error('Exception fetching brands:', error);
    return [];
  }
}

function mapDatabaseProductToApp(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    reference: dbProduct.reference,
    name: dbProduct.name,
    category: dbProduct.category as ProductCategory,
    brand: dbProduct.brand,
    crateType: dbProduct.crate_type,
    unitPrice: dbProduct.unit_price,
    cratePrice: dbProduct.crate_price,
    consignPrice: dbProduct.consign_price,
    description: dbProduct.description,
    alcoholContent: dbProduct.alcohol_content,
    volume: dbProduct.volume,
    isActive: dbProduct.is_active,
    imageUrl: dbProduct.image_url,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: new Date(dbProduct.updated_at),
    pricePerUnit: dbProduct.crate_price,
    consigneAmount: dbProduct.consign_price
  };
}
