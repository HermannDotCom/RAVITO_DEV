/*
  # Ajouter les politiques RLS pour order_items

  1. Politiques
    - INSERT: Permet aux clients de créer des items lors de la création de commande
    - SELECT: Permet aux clients de voir leurs propres items, aux fournisseurs de voir les items des commandes qui leur sont assignées, et aux admins de tout voir
    - UPDATE: Permet aux admins de modifier les items
    - DELETE: Permet aux admins de supprimer les items

  2. Sécurité
    - Les clients peuvent insérer des items uniquement pour leurs propres commandes
    - Les fournisseurs voient uniquement les items des commandes qui leur sont assignées
    - Contrôles d'approbation et de rôle
*/

-- Politique INSERT pour les clients
CREATE POLICY "Clients can insert order items for their orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.client_id = auth.uid()
    )
  );

-- Politique SELECT pour les clients (voir leurs propres items)
CREATE POLICY "Clients can view their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.client_id = auth.uid()
    )
  );

-- Politique SELECT pour les fournisseurs (voir items des commandes assignées)
CREATE POLICY "Suppliers can view order items of assigned orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN profiles ON profiles.id = auth.uid()
      WHERE orders.id = order_items.order_id
        AND orders.supplier_id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
  );

-- Politique SELECT pour les admins (voir tous les items)
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Politique UPDATE pour les admins
CREATE POLICY "Admins can update order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Politique DELETE pour les admins
CREATE POLICY "Admins can delete order items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );