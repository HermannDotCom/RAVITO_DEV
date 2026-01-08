-- Migration pour corriger la dépendance circulaire de is_admin() et implémenter la mise à jour de la notation globale.

-- Étape 1: Supprimer toutes les politiques RLS qui dépendent de is_admin()
-- Nous allons recréer ces politiques avec une vérification directe du rôle.

-- Politiques sur la table 'orders'
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
DROP POLICY IF EXISTS "orders_update_admin" ON orders;

-- Politiques sur la table 'order_items'
DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;

-- Politiques sur la table 'profiles'
-- Ces politiques ont déjà été traitées dans 20251228202137_fix_rls_circular_dependency_and_auth.sql
-- Nous allons nous assurer qu'elles sont bien définies sans is_admin() dans la prochaine étape.

-- Politiques sur la table 'products'
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

-- Politiques sur la table 'supplier_zones'
DROP POLICY IF EXISTS "supplier_zones_select_admin" ON supplier_zones;

-- Politiques sur la table 'zones'
DROP POLICY IF EXISTS "zones_insert_admin" ON zones;
DROP POLICY IF EXISTS "zones_update_admin" ON zones;
DROP POLICY IF EXISTS "zones_delete_admin" ON zones;

-- Politiques sur la table 'supplier_offers'
DROP POLICY IF EXISTS "supplier_offers_select_admin" ON supplier_offers;

-- Politiques sur la table 'ratings'
DROP POLICY IF EXISTS "ratings_select_admin" ON ratings;


-- Étape 2: Recréer les politiques RLS sans utiliser is_admin()
-- Utiliser une sous-requête directe pour vérifier le rôle 'admin' à partir de la table 'profiles'.

-- Politiques sur la table 'orders'
CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'order_items'
CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'profiles'
-- Nous allons nous assurer que les politiques existantes sont correctes.
-- Si elles n'ont pas été mises à jour par 20251228202137_fix_rls_circular_dependency_and_auth.sql,
-- nous les mettrons à jour ici.

-- Vérifier et recréer si nécessaire les politiques 'profiles_select_admin' et 'profiles_update_admin'
-- pour s'assurer qu'elles n'utilisent pas is_admin()
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'products'
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'supplier_zones'
CREATE POLICY "supplier_zones_select_admin"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'zones'
CREATE POLICY "zones_insert_admin"
  ON zones FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "zones_update_admin"
  ON zones FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "zones_delete_admin"
  ON zones FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'supplier_offers'
CREATE POLICY "supplier_offers_select_admin"
  ON supplier_offers FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Politiques sur la table 'ratings'
CREATE POLICY "ratings_select_admin"
  ON ratings FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


-- Étape 3: Supprimer la fonction is_admin() une fois toutes les dépendances résolues
DROP FUNCTION IF EXISTS is_admin();


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

CREATE TRIGGER on_new_rating
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();
