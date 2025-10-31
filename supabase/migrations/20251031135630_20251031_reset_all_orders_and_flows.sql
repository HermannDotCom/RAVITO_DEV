/*
  # Réinitialisation complète des commandes et flux

  1. Nettoyage
    - Supprimer toutes les évaluations (ratings)
    - Supprimer toutes les offres fournisseurs (supplier_offers)
    - Supprimer tous les items de commandes (order_items)
    - Supprimer toutes les commandes (orders)
    - Nettoyer les notifications liées aux commandes

  2. Sécurité
    - Préserve les utilisateurs, produits, zones
    - Utilise CASCADE pour nettoyer les dépendances
    - Réinitialise seulement les données transactionnelles

  Note: Cette migration réinitialise l'état de l'application pour tests propres
*/

-- Supprimer les évaluations
DELETE FROM ratings WHERE TRUE;

-- Supprimer les offres fournisseurs
DELETE FROM supplier_offers WHERE TRUE;

-- Supprimer les items de commandes (doit être avant orders à cause des FK)
DELETE FROM order_items WHERE TRUE;

-- Supprimer les commandes
DELETE FROM orders WHERE TRUE;

-- Nettoyer les notifications liées aux commandes
DELETE FROM notifications 
WHERE type IN ('new_order', 'order_accepted', 'order_delivered', 'new_offer', 'offer_accepted');
