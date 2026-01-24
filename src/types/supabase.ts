export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      commission_settings: {
        Row: {
          id: string
          client_commission_percentage: number
          supplier_commission_percentage: number
          effective_from: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_commission_percentage?: number
          supplier_commission_percentage?: number
          effective_from?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_commission_percentage?: number
          supplier_commission_percentage?: number
          effective_from?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      delivery_zones: {
        Row: {
          id: string
          commune_name: string
          is_active: boolean
          max_suppliers: number
          minimum_coverage: number
          operating_hours: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          commune_name: string
          is_active?: boolean
          max_suppliers?: number
          minimum_coverage?: number
          operating_hours?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          commune_name?: string
          is_active?: boolean
          max_suppliers?: number
          minimum_coverage?: number
          operating_hours?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          with_consigne: boolean
          unit_price: number
          crate_price: number
          consign_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          with_consigne?: boolean
          unit_price: number
          crate_price: number
          consign_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          with_consigne?: boolean
          unit_price?: number
          crate_price?: number
          consign_price?: number
          subtotal?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          client_id: string
          supplier_id: string | null
          status: Database['public']['Enums']['order_status']
          total_amount: number
          consigne_total: number
          client_commission: number
          supplier_commission: number
          net_supplier_amount: number
          delivery_address: string
          coordinates: unknown
          payment_method: Database['public']['Enums']['payment_method']
          payment_status: Database['public']['Enums']['payment_status']
          estimated_delivery_time: number | null
          accepted_at: string | null
          delivered_at: string | null
          paid_at: string | null
          transferred_at: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_instructions: string | null
          uses_profile_address: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          supplier_id?: string | null
          status?: Database['public']['Enums']['order_status']
          total_amount: number
          consigne_total?: number
          client_commission?: number
          supplier_commission?: number
          net_supplier_amount?: number
          delivery_address: string
          coordinates: unknown
          payment_method: Database['public']['Enums']['payment_method']
          payment_status?: Database['public']['Enums']['payment_status']
          estimated_delivery_time?: number | null
          accepted_at?: string | null
          delivered_at?: string | null
          paid_at?: string | null
          transferred_at?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_instructions?: string | null
          uses_profile_address?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          supplier_id?: string | null
          status?: Database['public']['Enums']['order_status']
          total_amount?: number
          consigne_total?: number
          client_commission?: number
          supplier_commission?: number
          net_supplier_amount?: number
          delivery_address?: string
          coordinates?: unknown
          payment_method?: Database['public']['Enums']['payment_method']
          payment_status?: Database['public']['Enums']['payment_status']
          estimated_delivery_time?: number | null
          accepted_at?: string | null
          delivered_at?: string | null
          paid_at?: string | null
          transferred_at?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_instructions?: string | null
          uses_profile_address?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          profile_id: string
          method: Database['public']['Enums']['payment_method']
          is_preferred: boolean
          account_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          method: Database['public']['Enums']['payment_method']
          is_preferred?: boolean
          account_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          method?: Database['public']['Enums']['payment_method']
          is_preferred?: boolean
          account_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          reference: string
          name: string
          category: Database['public']['Enums']['product_category']
          brand: string
          crate_type: Database['public']['Enums']['crate_type']
          unit_price: number
          crate_price: number
          consign_price: number
          description: string | null
          alcohol_content: number | null
          volume: string
          is_active: boolean
          image_url: string | null
          image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          name: string
          category: Database['public']['Enums']['product_category']
          brand: string
          crate_type: Database['public']['Enums']['crate_type']
          unit_price: number
          crate_price: number
          consign_price: number
          description?: string | null
          alcohol_content?: number | null
          volume: string
          is_active?: boolean
          image_url?: string | null
          image_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          name?: string
          category?: Database['public']['Enums']['product_category']
          brand?: string
          crate_type?: Database['public']['Enums']['crate_type']
          unit_price?: number
          crate_price?: number
          consign_price?: number
          description?: string | null
          alcohol_content?: number | null
          volume?: string
          is_active?: boolean
          image_url?: string | null
          image_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: Database['public']['Enums']['user_role']
          name: string
          phone: string
          address: string
          coordinates: unknown | null
          business_name: string | null
          business_hours: string | null
          responsible_person: string | null
          coverage_zone: string | null
          delivery_capacity: Database['public']['Enums']['delivery_capacity'] | null
          rating: number
          total_orders: number
          is_active: boolean
          is_approved: boolean
          approval_status: Database['public']['Enums']['approval_status']
          approved_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database['public']['Enums']['user_role']
          name: string
          phone: string
          address: string
          coordinates?: unknown | null
          business_name?: string | null
          business_hours?: string | null
          responsible_person?: string | null
          coverage_zone?: string | null
          delivery_capacity?: Database['public']['Enums']['delivery_capacity'] | null
          rating?: number
          total_orders?: number
          is_active?: boolean
          is_approved?: boolean
          approval_status?: Database['public']['Enums']['approval_status']
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['user_role']
          name?: string
          phone?: string
          address?: string
          coordinates?: unknown | null
          business_name?: string | null
          business_hours?: string | null
          responsible_person?: string | null
          coverage_zone?: string | null
          delivery_capacity?: Database['public']['Enums']['delivery_capacity'] | null
          rating?: number
          total_orders?: number
          is_active?: boolean
          is_approved?: boolean
          approval_status?: Database['public']['Enums']['approval_status']
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          order_id: string
          from_user_id: string
          to_user_id: string
          from_user_role: Database['public']['Enums']['user_role']
          to_user_role: Database['public']['Enums']['user_role']
          punctuality: number
          quality: number
          communication: number
          overall: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_user_id: string
          to_user_id: string
          from_user_role: Database['public']['Enums']['user_role']
          to_user_role: Database['public']['Enums']['user_role']
          punctuality: number
          quality: number
          communication: number
          overall: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_user_id?: string
          to_user_id?: string
          from_user_role?: Database['public']['Enums']['user_role']
          to_user_role?: Database['public']['Enums']['user_role']
          punctuality?: number
          quality?: number
          communication?: number
          overall?: number
          comment?: string | null
          created_at?: string
        }
      }
      supplier_zones: {
        Row: {
          id: string
          supplier_id: string
          zone_id: string
          is_active: boolean
          registered_at: string
          approved_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          reactivated_at: string | null
          total_orders: number
          success_rate: number
          average_delivery_time: number
          last_order_date: string | null
          max_delivery_radius: number
          minimum_order_amount: number
          delivery_fee: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          zone_id: string
          is_active?: boolean
          registered_at?: string
          approved_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          reactivated_at?: string | null
          total_orders?: number
          success_rate?: number
          average_delivery_time?: number
          last_order_date?: string | null
          max_delivery_radius?: number
          minimum_order_amount?: number
          delivery_fee?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          zone_id?: string
          is_active?: boolean
          registered_at?: string
          approved_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          reactivated_at?: string | null
          total_orders?: number
          success_rate?: number
          average_delivery_time?: number
          last_order_date?: string | null
          max_delivery_radius?: number
          minimum_order_amount?: number
          delivery_fee?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          activity_description: string
          related_entity_type: string | null
          related_entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          activity_description: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          activity_description?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          check_role: Database['public']['Enums']['user_role']
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_approved_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      approval_status: 'pending' | 'approved' | 'rejected'
      crate_type: 'C24' | 'C12' | 'C12V' | 'C6'
      delivery_capacity: 'truck' | 'tricycle' | 'motorcycle'
      // Note: 'accepted' status is deprecated and should not be used in new code
      order_status: 'pending' | 'awaiting-client-validation' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
      payment_method: 'orange' | 'mtn' | 'moov' | 'wave' | 'card'
      payment_status: 'pending' | 'paid' | 'transferred' | 'completed'
      product_category: 'biere' | 'soda' | 'vin' | 'eau' | 'spiritueux'
      user_role: 'admin' | 'client' | 'supplier'
    }
  }
}
