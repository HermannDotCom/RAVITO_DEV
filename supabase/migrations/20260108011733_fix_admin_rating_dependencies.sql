-- Migration pour corriger la dépendance circulaire de is_admin() et implémenter la mise à jour de la notation globale.

-- Étape 1: Supprimer toutes les politiques RLS qui dépendent de is_admin()
-- Nous allons recréer ces politiques avec une vérification directe du rôle.

-- Politiques sur la table 'profiles'
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Politiques sur la table 'products'
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- Politiques sur la table 'orders'
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- Politiques sur la table 'order_items'
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- Politiques sur la table 'ratings'
DROP POLICY IF EXISTS "Users can view ratings appropriately" ON ratings;

-- Politiques sur la table 'delivery_zones'
DROP POLICY IF EXISTS "Admins can insert delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admins can update delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admins can delete delivery zones" ON delivery_zones;

-- Politiques sur la table 'supplier_zones'
DROP POLICY IF EXISTS "Suppliers can register for zones" ON supplier_zones;
DROP POLICY IF EXISTS "Suppliers can update their zones" ON supplier_zones;
DROP POLICY IF EXISTS "Admins can delete supplier zones" ON supplier_zones;

-- Politiques sur la table 'payment_methods'
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

-- Politiques sur la table 'commission_settings'
DROP POLICY IF EXISTS "Admins can insert commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Admins can update commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Admins can delete commission settings" ON commission_settings;

-- Étape 2: Supprimer la fonction is_admin() une fois toutes les dépendances résolues
DROP FUNCTION IF EXISTS is_admin();

-- Étape 3: Recréer les politiques RLS sans utiliser is_admin()
-- Utiliser une sous-requête directe pour vérifier le rôle 'admin' à partir de la table 'profiles'.

-- Politiques sur la table 'profiles'
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'products'
CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'orders'
CREATE POLICY "Users can view relevant orders"
  ON orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update relevant orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (client_id = auth.uid() OR supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'order_items'
CREATE POLICY "Users can view order items of their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (client_id = auth.uid() OR supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Users can insert order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (client_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'ratings'
CREATE POLICY "Users can view ratings appropriately"
  ON ratings FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'delivery_zones'
CREATE POLICY "Admins can insert delivery zones"
  ON delivery_zones FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update delivery zones"
  ON delivery_zones FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete delivery zones"
  ON delivery_zones FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'supplier_zones'
CREATE POLICY "Suppliers can register for zones"
  ON supplier_zones FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Suppliers can update their zones"
  ON supplier_zones FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (supplier_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete supplier zones"
  ON supplier_zones FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'payment_methods'
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'commission_settings'
CREATE POLICY "Admins can insert commission settings"
  ON commission_settings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update commission settings"
  ON commission_settings FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete commission settings"
  ON commission_settings FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Étape 4: Implémenter la logique de mise à jour de la notation globale
-- Ceci est repris de 20260108120000_fix_rating_update_trigger.sql

CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating REAL;
BEGIN
  -- Calculer la nouvelle moyenne des notes pour l'utilisateur qui a reçu la note
  SELECT AVG(overall) INTO avg_rating
  FROM public.ratings
  WHERE to_user_id = NEW.to_user_id;

  -- Mettre à jour la table des profils
  UPDATE public.profiles
  SET rating = avg_rating
  WHERE id = NEW.to_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_rating ON public.ratings;
CREATE TRIGGER on_new_rating
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();