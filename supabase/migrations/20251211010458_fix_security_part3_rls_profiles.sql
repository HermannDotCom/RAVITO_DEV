/*
  # Fix Security Issues - Part 3: Optimize RLS for Profiles Table
  
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
*/

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Suppliers can update their own profile" ON profiles;
CREATE POLICY "Suppliers can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) AND role = 'supplier')
  WITH CHECK (id = (select auth.uid()) AND role = 'supplier');

DROP POLICY IF EXISTS "Clients can update their own profile" ON profiles;
CREATE POLICY "Clients can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) AND role = 'client')
  WITH CHECK (id = (select auth.uid()) AND role = 'client');

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile" ON profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
CREATE POLICY "Allow authenticated users to insert their own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Remove old duplicate policy if it exists
DROP POLICY IF EXISTS "Users can view and update their own profile" ON profiles;