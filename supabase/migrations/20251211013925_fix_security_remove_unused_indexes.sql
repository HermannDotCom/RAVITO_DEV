/*
  # Remove Unused Indexes
  
  Remove all indexes that are not being used to reduce storage overhead
  and improve write performance.
  
  ## Indexes Removed (38 total)
  - user_activity_log: 3 indexes
  - support_tickets: 2 indexes
  - ticket_attachments: 2 indexes
  - profiles: 4 indexes
  - products: 2 indexes
  - orders: 3 indexes
  - order_items: 1 index
  - supplier_zones: 3 indexes
  - notifications: 3 indexes
  - zone_registration_requests: 2 indexes
  - zones: 1 index
  - supplier_offers: 1 index
  - transfers: 7 indexes
  - organization_members: 1 index
  - role_permissions: 1 index
  - ticket_messages: 1 index
*/

-- user_activity_log indexes
DROP INDEX IF EXISTS idx_user_activity_log_created_at;
DROP INDEX IF EXISTS idx_user_activity_log_activity_type;
DROP INDEX IF EXISTS idx_user_activity_log_related_entity;

-- support_tickets indexes
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_assigned_to;

-- ticket_attachments indexes
DROP INDEX IF EXISTS idx_ticket_attachments_ticket_id;
DROP INDEX IF EXISTS idx_ticket_attachments_uploaded_by;

-- profiles indexes
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_is_approved;
DROP INDEX IF EXISTS idx_profiles_coordinates;
DROP INDEX IF EXISTS idx_profiles_zone_id;

-- products indexes
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_is_active;

-- orders indexes
DROP INDEX IF EXISTS idx_orders_payment_status;
DROP INDEX IF EXISTS idx_orders_coordinates;
DROP INDEX IF EXISTS idx_orders_zone_status;

-- order_items indexes
DROP INDEX IF EXISTS idx_order_items_product_id;

-- supplier_zones indexes
DROP INDEX IF EXISTS idx_supplier_zones_is_active;
DROP INDEX IF EXISTS idx_supplier_zones_supplier_zone;
DROP INDEX IF EXISTS idx_supplier_zones_approved_by;

-- notifications indexes
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_created;

-- zone_registration_requests indexes
DROP INDEX IF EXISTS idx_zone_registration_requests_zone_id;
DROP INDEX IF EXISTS idx_zone_registration_requests_supplier_id;
DROP INDEX IF EXISTS idx_zone_registration_requests_reviewed_by;

-- zones indexes
DROP INDEX IF EXISTS idx_zones_active;

-- supplier_offers indexes
DROP INDEX IF EXISTS idx_supplier_offers_status;

-- transfers indexes
DROP INDEX IF EXISTS idx_transfers_supplier_id;
DROP INDEX IF EXISTS idx_transfers_status;
DROP INDEX IF EXISTS idx_transfers_approved_by;
DROP INDEX IF EXISTS idx_transfers_completed_at;
DROP INDEX IF EXISTS idx_transfers_completed_by;
DROP INDEX IF EXISTS idx_transfers_created_by;
DROP INDEX IF EXISTS idx_transfers_rejected_by;

-- organization_members indexes
DROP INDEX IF EXISTS idx_organization_members_token;

-- role_permissions indexes
DROP INDEX IF EXISTS idx_role_permissions_lookup;

-- ticket_messages indexes
DROP INDEX IF EXISTS idx_ticket_messages_user_id;