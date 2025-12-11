/*
  # Fix Missing RLS Policies
  
  This migration restores RLS policies that were removed during security fixes.
  These policies are critical for clients and suppliers to access their data.
  
  ## Changes
  
  1. **ZONES TABLE** - Add SELECT policy for authenticated users
     - All authenticated users need to view zones to place orders and create offers
  
  2. **SUPPLIER_OFFERS TABLE** - Add UPDATE policy for suppliers
     - Suppliers need to update their own offers (e.g., adjust prices, cancel)
  
  3. **TRANSFERS TABLE** - Add INSERT and UPDATE policies for suppliers
     - Suppliers need to create and manage their cash transfers
  
  4. **TRANSFER_ORDERS TABLE** - Add INSERT and UPDATE policies for suppliers
     - Suppliers need to link orders to their transfers
*/

-- ============================================================================
-- ZONES TABLE - Add SELECT policy for authenticated users
-- ============================================================================

-- All authenticated users can view zones
-- This is needed for clients to select their zone and suppliers to see available zones
DROP POLICY IF EXISTS "Authenticated users can view zones" ON zones;
CREATE POLICY "Authenticated users can view zones" ON zones
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- SUPPLIER_OFFERS TABLE - Add UPDATE policy for suppliers
-- ============================================================================

-- Suppliers can update their own offers (e.g., change price, cancel before client accepts)
DROP POLICY IF EXISTS "Suppliers can update own offers" ON supplier_offers;
CREATE POLICY "Suppliers can update own offers" ON supplier_offers
  FOR UPDATE TO authenticated
  USING (supplier_id = (select auth.uid()))
  WITH CHECK (supplier_id = (select auth.uid()));

-- ============================================================================
-- TRANSFERS TABLE - Add INSERT and UPDATE policies for suppliers
-- ============================================================================

-- Suppliers can create transfers to request cash transfers
DROP POLICY IF EXISTS "Suppliers can insert transfers" ON transfers;
CREATE POLICY "Suppliers can insert transfers" ON transfers
  FOR INSERT TO authenticated
  WITH CHECK (
    supplier_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'supplier' 
      AND is_approved = true
    )
  );

-- Suppliers can update their own transfers (e.g., add notes, cancel pending transfers)
DROP POLICY IF EXISTS "Suppliers can update own transfers" ON transfers;
CREATE POLICY "Suppliers can update own transfers" ON transfers
  FOR UPDATE TO authenticated
  USING (supplier_id = (select auth.uid()))
  WITH CHECK (supplier_id = (select auth.uid()));

-- ============================================================================
-- TRANSFER_ORDERS TABLE - Add INSERT and UPDATE policies for suppliers
-- ============================================================================

-- Suppliers can insert transfer_orders to link orders to their transfers
DROP POLICY IF EXISTS "Suppliers can insert transfer orders" ON transfer_orders;
CREATE POLICY "Suppliers can insert transfer orders" ON transfer_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = (select auth.uid())
    )
  );

-- Suppliers can update transfer_orders for their own transfers
DROP POLICY IF EXISTS "Suppliers can update own transfer orders" ON transfer_orders;
CREATE POLICY "Suppliers can update own transfer orders" ON transfer_orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = (select auth.uid())
    )
  );
