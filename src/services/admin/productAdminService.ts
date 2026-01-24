import { supabase } from '../../lib/supabase';
import { Product } from '../../types';

export interface CreateProductInput {
  reference: string;
  name: string;
  category: string;
  brand: string;
  crateType: string;
  volume: string;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  description?: string;
  alcoholContent?: number;
  imagePath?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export async function getAdminProducts(filters?: {
  isActive?: boolean;
  category?: string;
  brand?: string;
  search?: string;
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .order('name');

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.brand) {
    query = query.eq('brand', filters.brand);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return (data || []).map(mapProductFromDb);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      reference: input.reference,
      name: input.name,
      category: input.category,
      brand: input.brand,
      crate_type: input.crateType,
      volume: input.volume,
      unit_price: input.unitPrice,
      crate_price: input.cratePrice,
      consign_price: input.consignPrice,
      description: input.description,
      alcohol_content: input.alcoholContent,
      image_path: input.imagePath,
      image_url: input.imageUrl,
      is_active: input.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return mapProductFromDb(data);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.reference !== undefined) updateData.reference = input.reference;
  if (input.name !== undefined) updateData.name = input.name;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.brand !== undefined) updateData.brand = input.brand;
  if (input.crateType !== undefined) updateData.crate_type = input.crateType;
  if (input.volume !== undefined) updateData.volume = input.volume;
  if (input.unitPrice !== undefined) updateData.unit_price = input.unitPrice;
  if (input.cratePrice !== undefined) updateData.crate_price = input.cratePrice;
  if (input.consignPrice !== undefined) updateData.consign_price = input.consignPrice;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.alcoholContent !== undefined) updateData.alcohol_content = input.alcoholContent;
  if (input.imagePath !== undefined) updateData.image_path = input.imagePath;
  if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  return mapProductFromDb(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
  return updateProduct(id, { isActive });
}

function mapProductFromDb(data: any): Product {
  return {
    id: data.id,
    reference: data.reference,
    name: data.name,
    category: data.category,
    brand: data.brand,
    crateType: data.crate_type,
    volume: data.volume,
    unitPrice: data.unit_price,
    cratePrice: data.crate_price,
    consignPrice: data.consign_price,
    description: data.description,
    alcoholContent: data.alcohol_content,
    imagePath: data.image_path,
    imageUrl: data.image_url || data.image_path,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
