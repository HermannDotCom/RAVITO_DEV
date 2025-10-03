/*
  # Row Level Security (RLS) Configuration

  ## Vue d'ensemble
  Cette migration active et configure les politiques de sécurité au niveau des lignes (RLS)
  pour toutes les tables de la base de données DISTRI-NIGHT.

  ## Principes de sécurité

  ### 1. Accès par défaut : RESTRICTIF
  - Toutes les tables ont RLS activé
  - Aucun accès sans politique explicite
  - Authentification requise pour la plupart des opérations

  ### 2. Hiérarchie des rôles
  - **Admin** : Accès complet à toutes les données
  - **Client** : Accès à ses propres données + lecture produits/zones
  - **Supplier** : Accès à ses propres données + commandes assignées

  ### 3. Vérifications systématiques
  - auth.uid() pour identifier l'utilisateur connecté
  - Vérification du rôle via la table profiles
  - Validation de l'approbation pour actions sensibles

  ## Tables et Policies

  ### profiles
  - SELECT : Utilisateur peut voir son profil + admins voient tout
  - INSERT : Création automatique via trigger auth
  - UPDATE : Utilisateur peut modifier son profil + admins peuvent tout modifier
  - DELETE : Admins uniquement

  ### products
  - SELECT : Tous les utilisateurs authentifiés (catalogue public)
  - INSERT/UPDATE/DELETE : Admins uniquement

  ### orders
  - SELECT : Client voit ses commandes, supplier voit ses livraisons, admin voit tout
  - INSERT : Clients approuvés uniquement
  - UPDATE : Client peut annuler, supplier peut mettre à jour statut, admin tout
  - DELETE : Admins uniquement

  ### order_items
  - SELECT : Via les permissions orders
  - INSERT : Via les permissions orders
  - UPDATE/DELETE : Admins uniquement

  ### ratings
  - SELECT : Visible après que les deux parties aient noté
  - INSERT : Participants à la commande uniquement (une fois)
  - UPDATE/DELETE : Interdits (immuabilité)

  ### delivery_zones
  - SELECT : Tous les utilisateurs authentifiés
  - INSERT/UPDATE/DELETE : Admins uniquement

  ### supplier_zones
  - SELECT : Tous les utilisateurs authentifiés
  - INSERT : Admins + suppliers (auto-inscription)
  - UPDATE : Admins + supplier concerné
  - DELETE : Admins uniquement

  ### payment_methods
  - SELECT : Utilisateur voit ses méthodes
  - INSERT/UPDATE/DELETE : Utilisateur gère ses méthodes

  ### commission_settings
  - SELECT : Tous les utilisateurs authentifiés
  - INSERT/UPDATE/DELETE : Admins uniquement

  ## Fonctions Helper

  ### is_admin()
  Vérifie si l'utilisateur connecté est admin

  ### is_approved_user()
  Vérifie si l'utilisateur est approuvé et actif

  ### has_role(role)
  Vérifie le rôle de l'utilisateur
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Fonction: Vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Vérifier si l'utilisateur est approuvé
CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_approved = true
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Vérifier le rôle de l'utilisateur
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = check_role
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- SELECT: Utilisateur voit son profil, admins voient tout
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- INSERT: Automatique via trigger, mais politique permissive pour signup
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Utilisateur modifie son profil, admins modifient tout
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les produits actifs
CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

-- INSERT: Admins uniquement
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Admins uniquement
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- SELECT: Client voit ses commandes, supplier voit ses livraisons, admin tout
CREATE POLICY "Users can view relevant orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    supplier_id = auth.uid() OR
    is_admin()
  );

-- INSERT: Clients approuvés uniquement
CREATE POLICY "Approved clients can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    is_approved_user() AND
    has_role('client')
  );

-- UPDATE: Client peut annuler, supplier met à jour statut, admin tout
CREATE POLICY "Users can update relevant orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (client_id = auth.uid() AND status = 'pending') OR
    (supplier_id = auth.uid() AND is_approved_user()) OR
    is_admin()
  )
  WITH CHECK (
    (client_id = auth.uid() AND status = 'cancelled') OR
    (supplier_id = auth.uid() AND is_approved_user()) OR
    is_admin()
  );

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- ORDER_ITEMS POLICIES
-- ============================================================================

-- SELECT: Via les permissions de la commande parente
CREATE POLICY "Users can view order items of their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.client_id = auth.uid() OR orders.supplier_id = auth.uid() OR is_admin())
    )
  );

-- INSERT: Via les permissions de la commande parente
CREATE POLICY "Users can insert order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.client_id = auth.uid()
        AND orders.status = 'pending'
    ) OR is_admin()
  );

-- UPDATE: Admins uniquement
CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RATINGS POLICIES
-- ============================================================================

-- SELECT: Visible quand les deux parties ont noté, ou pour les participants, ou admin
CREATE POLICY "Users can view ratings appropriately"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR
    to_user_id = auth.uid() OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM ratings r2
      WHERE r2.order_id = ratings.order_id
        AND r2.from_user_id != ratings.from_user_id
    )
  );

-- INSERT: Participants à la commande uniquement, une seule fois
CREATE POLICY "Order participants can rate once"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND
    is_approved_user() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = ratings.order_id
        AND orders.status = 'delivered'
        AND (orders.client_id = auth.uid() OR orders.supplier_id = auth.uid())
    ) AND
    NOT EXISTS (
      SELECT 1 FROM ratings r
      WHERE r.order_id = ratings.order_id
        AND r.from_user_id = auth.uid()
    )
  );

-- UPDATE/DELETE: Interdits (immuabilité des évaluations)

-- ============================================================================
-- DELIVERY_ZONES POLICIES
-- ============================================================================

-- SELECT: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view delivery zones"
  ON delivery_zones FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Admins uniquement
CREATE POLICY "Admins can insert delivery zones"
  ON delivery_zones FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Admins uniquement
CREATE POLICY "Admins can update delivery zones"
  ON delivery_zones FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete delivery zones"
  ON delivery_zones FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- SUPPLIER_ZONES POLICIES
-- ============================================================================

-- SELECT: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view supplier zones"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Admins ou supplier s'inscrivant
CREATE POLICY "Suppliers can register for zones"
  ON supplier_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    (supplier_id = auth.uid() AND is_approved_user() AND has_role('supplier')) OR
    is_admin()
  );

-- UPDATE: Admins ou supplier concerné
CREATE POLICY "Suppliers can update their zones"
  ON supplier_zones FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid() OR is_admin())
  WITH CHECK (supplier_id = auth.uid() OR is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete supplier zones"
  ON supplier_zones FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- PAYMENT_METHODS POLICIES
-- ============================================================================

-- SELECT: Utilisateur voit ses méthodes, admins voient tout
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR is_admin());

-- INSERT: Utilisateur ajoute ses méthodes
CREATE POLICY "Users can add own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- UPDATE: Utilisateur modifie ses méthodes
CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() OR is_admin())
  WITH CHECK (profile_id = auth.uid() OR is_admin());

-- DELETE: Utilisateur supprime ses méthodes
CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid() OR is_admin());

-- ============================================================================
-- COMMISSION_SETTINGS POLICIES
-- ============================================================================

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les commissions
CREATE POLICY "Authenticated users can view commission settings"
  ON commission_settings FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Admins uniquement
CREATE POLICY "Admins can insert commission settings"
  ON commission_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Admins uniquement
CREATE POLICY "Admins can update commission settings"
  ON commission_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admins uniquement
CREATE POLICY "Admins can delete commission settings"
  ON commission_settings FOR DELETE
  TO authenticated
  USING (is_admin());
