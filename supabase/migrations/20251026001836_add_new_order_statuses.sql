/*
  # Ajouter nouveaux statuts de commande

  1. Nouveaux statuts
    - 'pending-offers' : Commande créée, fournisseurs peuvent faire des offres
    - 'offers-received' : Au moins une offre reçue
    - 'awaiting-payment' : Client a accepté une offre
    - 'paid' : Paiement effectué
    - 'awaiting-rating' : Livraison confirmée, évaluations en attente
*/

-- Ajouter les nouveaux statuts un par un
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending-offers';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'offers-received';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting-payment';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting-rating';