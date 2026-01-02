import { supabase } from '../lib/supabase';
import { getOrganizationOwnerId } from '../utils/organizationUtils';

export type ZoneRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ZoneRegistrationRequest {
  id: string;
  zone_id: string;
  supplier_id: string;
  status: ZoneRequestStatus;
  message?: string | null;
  admin_response?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  zone_name?: string;
  supplier_name?: string;
  supplier_email?: string;
  reviewed_by_name?: string;
}

export interface ZoneWithRequests {
  zone_id: string;
  zone_name: string;
  pending_requests_count: number;
}

export const zoneRequestService = {
  async createRequest(
    zoneId: string,
    supplierId: string,
    message?: string
  ): Promise<ZoneRegistrationRequest | null> {
    try {
      const existingRequest = await this.getSupplierRequestForZone(supplierId, zoneId);

      if (existingRequest && existingRequest.status === 'pending') {
        throw new Error('Une demande est déjà en cours pour cette zone');
      }

      const { data, error } = await supabase
        .from('zone_registration_requests')
        .insert({
          zone_id: zoneId,
          supplier_id: supplierId,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating zone request:', error);
      return null;
    }
  },

  async getSupplierRequestForZone(
    supplierId: string,
    zoneId: string
  ): Promise<ZoneRegistrationRequest | null> {
    try {
      // Get organization owner ID to fetch data for the whole organization
      const organizationOwnerId = await getOrganizationOwnerId(supplierId);

      const { data, error } = await supabase
        .from('zone_registration_requests')
        .select('*')
        .eq('supplier_id', organizationOwnerId)
        .eq('zone_id', zoneId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching supplier request:', error);
      return null;
    }
  },

  async getPendingRequestsForZone(zoneId: string): Promise<ZoneRegistrationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('zone_registration_requests')
        .select(`
          *,
          profiles!zone_registration_requests_supplier_id_fkey(name, email)
        `)
        .eq('zone_id', zoneId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((req: any) => ({
        ...req,
        supplier_name: req.profiles?.name,
        supplier_email: req.profiles?.email
      }));
    } catch (error) {
      console.error('Error fetching zone requests:', error);
      return [];
    }
  },

  async getAllPendingRequests(): Promise<ZoneRegistrationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('zone_registration_requests')
        .select(`
          *,
          zones(name),
          supplier:profiles!zone_registration_requests_supplier_id_fkey(name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((req: any) => ({
        ...req,
        zone_name: req.zones?.name,
        supplier_name: req.supplier?.name,
        supplier_email: req.supplier?.email
      }));
    } catch (error) {
      console.error('Error fetching all pending requests:', error);
      return [];
    }
  },

  async getZonesWithPendingRequests(): Promise<ZoneWithRequests[]> {
    try {
      const { data, error } = await supabase
        .from('zone_registration_requests')
        .select(`
          zone_id,
          zones(name)
        `)
        .eq('status', 'pending');

      if (error) throw error;

      const zonesMap = new Map<string, { zone_name: string; count: number }>();

      (data || []).forEach((req: any) => {
        const zoneId = req.zone_id;
        const zoneName = req.zones?.name || 'Zone inconnue';

        if (zonesMap.has(zoneId)) {
          zonesMap.get(zoneId)!.count++;
        } else {
          zonesMap.set(zoneId, { zone_name: zoneName, count: 1 });
        }
      });

      return Array.from(zonesMap.entries()).map(([zone_id, info]) => ({
        zone_id,
        zone_name: info.zone_name,
        pending_requests_count: info.count
      }));
    } catch (error) {
      console.error('Error fetching zones with pending requests:', error);
      return [];
    }
  },

  async approveRequest(
    requestId: string,
    adminId: string,
    adminResponse?: string
  ): Promise<boolean> {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('zone_registration_requests')
        .select('zone_id, supplier_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('zone_registration_requests')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_response: adminResponse || null
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { data: existingZone } = await supabase
        .from('supplier_zones')
        .select('id')
        .eq('supplier_id', request.supplier_id)
        .eq('zone_id', request.zone_id)
        .maybeSingle();

      if (!existingZone) {
        const { error: insertError } = await supabase
          .from('supplier_zones')
          .insert({
            supplier_id: request.supplier_id,
            zone_id: request.zone_id,
            is_active: true
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  },

  async rejectRequest(
    requestId: string,
    adminId: string,
    adminResponse?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('zone_registration_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_response: adminResponse || null
        })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  },

  async getPendingRequestsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('zone_registration_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
      return 0;
    }
  },

  async cancelRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('zone_registration_requests')
        .delete()
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error canceling request:', error);
      return false;
    }
  },

  async getSupplierPendingRequests(supplierId: string): Promise<ZoneRegistrationRequest[]> {
    try {
      // Get organization owner ID to fetch data for the whole organization
      const organizationOwnerId = await getOrganizationOwnerId(supplierId);

      const { data, error } = await supabase
        .from('zone_registration_requests')
        .select(`
          *,
          zones(name)
        `)
        .eq('supplier_id', organizationOwnerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((req: any) => ({
        ...req,
        zone_name: req.zones?.name
      }));
    } catch (error) {
      console.error('Error fetching supplier pending requests:', error);
      return [];
    }
  },

  getStatusLabel(status: ZoneRequestStatus): string {
    const labels = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Refusée'
    };
    return labels[status];
  },

  getStatusColor(status: ZoneRequestStatus): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status];
  }
};
