/*
  # Fix Security Issues - Part 1: Indexes
  
  ## 1. Missing Indexes on Foreign Keys
  Add indexes to improve query performance on foreign key columns
  
  ## 2. Remove Duplicate Indexes
  Drop duplicate index to reduce storage usage
*/

-- ============================================================================
-- PART 1: Add Missing Indexes on Foreign Keys
-- ============================================================================

-- supplier_zones.approved_by
CREATE INDEX IF NOT EXISTS idx_supplier_zones_approved_by 
  ON supplier_zones(approved_by);

-- ticket_attachments.uploaded_by
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by 
  ON ticket_attachments(uploaded_by);

-- ticket_messages.user_id
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id 
  ON ticket_messages(user_id);

-- transfers foreign keys
CREATE INDEX IF NOT EXISTS idx_transfers_completed_by 
  ON transfers(completed_by);

CREATE INDEX IF NOT EXISTS idx_transfers_created_by 
  ON transfers(created_by);

CREATE INDEX IF NOT EXISTS idx_transfers_rejected_by 
  ON transfers(rejected_by);

-- zone_registration_requests.reviewed_by
CREATE INDEX IF NOT EXISTS idx_zone_registration_requests_reviewed_by 
  ON zone_registration_requests(reviewed_by);

-- ============================================================================
-- PART 2: Remove Duplicate Index
-- ============================================================================

DROP INDEX IF EXISTS idx_supplier_zones_supplier_id;