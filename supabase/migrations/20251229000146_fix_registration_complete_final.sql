/*
  # Fix Registration - Solution Complète et Définitive
  
  ## Diagnostic
  1. Trigger obsolète n'insère que 3 colonnes (id, email, role)
  2. Colonne 'name' est NOT NULL mais non insérée par trigger
  3. Policy INSERT bloque avec auth.uid() = NULL pendant signup
  4. is_admin() cause récursion infinie dans policies
  
  ## Solution
  1. Supprimer TOUTE policy INSERT (trigger bypasse RLS avec SECURITY DEFINER)
  2. Recréer trigger complet avec TOUS les champs nécessaires
  3. Utiliser is_current_user_admin() SECURITY DEFINER pour éviter récursion
  4. Nettoyer policies obsolètes
*/

-- =====================================================
-- ÉTAPE 1 : NETTOYER TOUTES LES POLICIES PROBLÉMATIQUES
-- =====================================================

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow system to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_orders" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- =====================================================
-- ÉTAPE 2 : ASSURER QUE is_current_user_admin() EXISTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- =====================================================
-- ÉTAPE 3 : RECRÉER TRIGGER COMPLET
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
  v_business_name text;
BEGIN
  -- Extraire les métadonnées avec valeurs par défaut
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_address := NEW.raw_user_meta_data->>'address';
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  
  -- Valider le rôle
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    v_role := 'client';
  END IF;
  
  -- Insérer le profil complet
  INSERT INTO public.profiles (
    id,
    email,
    role,
    name,
    phone,
    address,
    business_name,
    is_active,
    is_approved,
    approval_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_role::user_role,
    v_name,
    v_phone,
    v_address,
    v_business_name,
    true,
    CASE WHEN v_role = 'admin' THEN true ELSE false END,
    CASE WHEN v_role = 'admin' THEN 'approved' ELSE 'pending' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer l'inscription
  RAISE LOG 'Erreur dans handle_new_user pour user %: % %', NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ÉTAPE 4 : CRÉER POLICIES SIMPLES SANS RÉCURSION
-- =====================================================

-- SELECT: Voir son propre profil OU tous si admin
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  );

-- SELECT: Voir profils liés aux commandes partagées
CREATE POLICY "profiles_select_for_orders"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE (orders.client_id = profiles.id OR orders.supplier_id = profiles.id)
        AND (orders.client_id = auth.uid() OR orders.supplier_id = auth.uid())
    )
  );

-- UPDATE: Modifier son propre profil OU tous si admin
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  );

-- DELETE: Seulement admin
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_current_user_admin());

-- PAS DE POLICY INSERT - Le trigger s'en charge

-- =====================================================
-- ÉTAPE 5 : VÉRIFICATIONS FINALES
-- =====================================================

-- S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger qui crée automatiquement le profil lors de l''inscription. SECURITY DEFINER pour bypasser RLS.';

COMMENT ON FUNCTION public.is_current_user_admin() IS 
  'Fonction SECURITY DEFINER qui vérifie si l''utilisateur actuel est admin sans causer de récursion RLS.';

COMMENT ON TABLE profiles IS 
  'Profils utilisateurs. Créés automatiquement par trigger. Pas d''INSERT direct autorisé.';
