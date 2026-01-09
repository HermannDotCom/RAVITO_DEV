-- Migration consolidée pour supprimer l'ancienne fonction is_admin() et TOUTES ses dépendances.
-- Cette migration est maintenant la seule source de vérité pour le nettoyage.

-- Étape 1: Supprimer toutes les politiques RLS connues qui dépendaient de la fonction is_admin().
-- L'utilisation de "IF EXISTS" garantit que ce script peut être exécuté sans erreur même si une politique a déjà été supprimée.

-- Politiques sur la table ''profiles''
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Politiques sur la table ''products''
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- Politiques sur la table ''orders''
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- Politiques sur la table ''order_items''
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- Politiques sur la table ''ratings''
DROP POLICY IF EXISTS "Users can view ratings appropriately" ON ratings;

-- Politiques sur la table ''delivery_zones''
DROP POLICY IF EXISTS "Admins can insert delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admins can update delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admins can delete delivery zones" ON delivery_zones;

-- Politiques sur la table ''supplier_zones''
DROP POLICY IF EXISTS "Suppliers can register for zones" ON supplier_zones;
DROP POLICY IF EXISTS "Suppliers can update their zones" ON supplier_zones;
DROP POLICY IF EXISTS "Admins can delete supplier zones" ON supplier_zones;

-- Politiques sur la table ''payment_methods''
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

-- Politiques sur la table ''commission_settings''
DROP POLICY IF EXISTS "Admins can insert commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Admins can update commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Admins can delete commission settings" ON commission_settings;

-- Étape 2: Supprimer les anciennes fonctions de test de rôle une fois toutes les dépendances résolues.
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_approved_user();
DROP FUNCTION IF EXISTS has_role(user_role);

-- Fin de la migration de nettoyage. Le terrain est propre.
