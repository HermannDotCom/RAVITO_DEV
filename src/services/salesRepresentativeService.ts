import { supabase } from '../lib/supabase';

export interface SalesRepresentative {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  zone_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone?: {
    id: string;
    name: string;
  };
}

/**
 * Récupère la liste des commerciaux actifs
 * Utilisé dans le formulaire d'inscription
 */
export async function getActiveSalesRepresentatives(): Promise<SalesRepresentative[]> {
  try {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select(`
        *,
        zone:zones(id, name)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sales representatives:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching sales representatives:', error);
    return [];
  }
}

/**
 * Récupère un commercial par son ID
 */
export async function getSalesRepresentativeById(id: string): Promise<SalesRepresentative | null> {
  try {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select(`
        *,
        zone:zones(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching sales representative:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching sales representative:', error);
    return null;
  }
}

/**
 * Crée un nouveau commercial (admin uniquement)
 */
export async function createSalesRepresentative(
  data: Omit<SalesRepresentative, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: SalesRepresentative; error?: string }> {
  try {
    const { data: newRep, error } = await supabase
      .from('sales_representatives')
      .insert({
        user_id: data.user_id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        zone_id: data.zone_id,
        is_active: data.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sales representative:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: newRep };
  } catch (error) {
    console.error('Exception creating sales representative:', error);
    return { success: false, error: 'Erreur lors de la création du commercial' };
  }
}

/**
 * Met à jour un commercial (admin uniquement)
 */
export async function updateSalesRepresentative(
  id: string,
  updates: Partial<Omit<SalesRepresentative, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; data?: SalesRepresentative; error?: string }> {
  try {
    const { data: updatedRep, error } = await supabase
      .from('sales_representatives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sales representative:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: updatedRep };
  } catch (error) {
    console.error('Exception updating sales representative:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du commercial' };
  }
}

/**
 * Désactive un commercial (admin uniquement)
 */
export async function deactivateSalesRepresentative(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sales_representatives')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating sales representative:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deactivating sales representative:', error);
    return false;
  }
}
