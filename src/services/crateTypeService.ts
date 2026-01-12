import { supabase } from '../lib/supabase';
import { CrateTypeConfig } from '../types/crateTypes';

export const getCrateTypes = async (): Promise<CrateTypeConfig[]> => {
  const { data, error } = await supabase
    .from('crate_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching crate types:', error);
    return [];
  }

  return data.map(mapCrateType);
};

export const getConsignableCrateTypes = async (): Promise<CrateTypeConfig[]> => {
  const { data, error } = await supabase
    .from('crate_types')
    .select('*')
    .eq('is_active', true)
    .eq('is_consignable', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching consignable crate types:', error);
    return [];
  }

  return data.map(mapCrateType);
};

export const updateCrateTypeConsignable = async (
  id: string,
  isConsignable: boolean
): Promise<{ success: boolean; error: string | null }> => {
  const { error } = await supabase
    .from('crate_types')
    .update({ 
      is_consignable: isConsignable, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
};

const mapCrateType = (data: Record<string, unknown>): CrateTypeConfig => ({
  id: data.id,
  code: data.code,
  label: data.label,
  shortLabel: data.short_label || data.code,
  description: data.description || '',
  isConsignable: data.is_consignable,
  icon: data.icon || '📦',
  displayOrder: data.display_order,
  isActive: data.is_active,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});
