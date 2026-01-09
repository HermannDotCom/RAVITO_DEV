-- Migration consolidée pour supprimer TOUTES les anciennes fonctions et leurs dépendances.
-- Cette migration est la seule source de vérité pour le nettoyage complet.

-- ============================================================================
-- ÉTAPE 1: Suppression exhaustive de TOUTES les politiques RLS dépendantes
-- ============================================================================

-- Politiques sur la table 'profiles'
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Politiques sur la table 'products'
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- Politiques sur la table 'orders' (incluant celles dépendant de is_approved_user)
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Approved clients can create orders" ON orders;

-- Politiques sur la table 'order_items'
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- Politiques sur la table 'ratings' (incluant celles dépendant de is_approved_user)
DROP POLICY IF EXISTS "Users can view ratings appropriately" ON ratings;
DROP POLICY IF EXISTS "Order participants can rate once" ON ratings;

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

-- ============================================================================
-- ÉTAPE 2: Suppression des fonctions une fois toutes les dépendances résolues
-- ============================================================================
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_approved_user();
DROP FUNCTION IF EXISTS has_role(user_role);

-- Fin de la migration de nettoyage. Le terrain est propre.
