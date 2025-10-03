/*
  # Seed Initial Data

  ## Vue d'ensemble
  Cette migration insère les données initiales dans la base de données:
  - Produits du catalogue (24 produits)
  - Zones de livraison (10 communes d'Abidjan)
  - Configuration des commissions

  ## Tables concernées
  - products: Catalogue complet de boissons
  - delivery_zones: Communes d'Abidjan
  - commission_settings: Configuration par défaut déjà insérée
*/

-- Insertion des produits
INSERT INTO products (reference, name, category, brand, crate_type, unit_price, crate_price, consign_price, description, alcohol_content, volume, is_active, image_url) VALUES

-- BIÈRES SOLIBRA
('FLAG33C24', 'Flag Spéciale 33cl', 'biere', 'Flag', 'C24', 750, 18000, 3000, 'Bière blonde premium de Côte d''Ivoire', 5.2, '33cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('FLAG66C12', 'Flag Spéciale 66cl', 'biere', 'Flag', 'C12', 1200, 14400, 3000, 'Bière blonde premium grande bouteille', 5.2, '66cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('AWOOYO33C24', 'Awooyo 33cl', 'biere', 'Awooyo', 'C24', 650, 15600, 3000, 'Bière locale traditionnelle', 4.8, '33cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('BEAUFORT33C24', 'Beaufort 33cl', 'biere', 'Beaufort', 'C24', 700, 16800, 3000, 'Bière blonde rafraîchissante', 5.0, '33cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('SOLIBRA33C24', 'Solibra Blonde 33cl', 'biere', 'Solibra', 'C24', 700, 16800, 3000, 'Bière blonde classique ivoirienne', 5.0, '33cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('SOLIBRA66C12', 'Solibra Blonde 66cl', 'biere', 'Solibra', 'C12', 1100, 13200, 3000, 'Bière blonde grande bouteille', 5.0, '66cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),
('PILS33C24', 'Pils 33cl', 'biere', 'Pils', 'C24', 650, 15600, 3000, 'Bière pils légère et rafraîchissante', 4.5, '33cl', true, 'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=400'),

-- BIÈRES BRASSIVOIRE
('CASTEL33C24', 'Castel Beer 33cl', 'biere', 'Castel', 'C24', 700, 16800, 3000, 'Bière blonde internationale', 5.0, '33cl', true, 'https://images.pexels.com/photos/5947044/pexels-photo-5947044.jpeg?auto=compress&cs=tinysrgb&w=400'),
('CASTEL66C12', 'Castel Beer 66cl', 'biere', 'Castel', 'C12', 1100, 13200, 3000, 'Bière blonde grande bouteille', 5.0, '66cl', true, 'https://images.pexels.com/photos/5947044/pexels-photo-5947044.jpeg?auto=compress&cs=tinysrgb&w=400'),
('MUTZIG33C24', 'Mutzig 33cl', 'biere', 'Mutzig', 'C24', 750, 18000, 3000, 'Bière alsacienne de qualité', 5.5, '33cl', true, 'https://images.pexels.com/photos/5947044/pexels-photo-5947044.jpeg?auto=compress&cs=tinysrgb&w=400'),

-- SODAS
('COCA33C24', 'Coca-Cola 33cl', 'soda', 'Coca-Cola', 'C24', 500, 12000, 3000, 'Boisson gazeuse rafraîchissante', NULL, '33cl', true, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400'),
('FANTA33C24', 'Fanta Orange 33cl', 'soda', 'Fanta', 'C24', 500, 12000, 3000, 'Boisson gazeuse à l''orange', NULL, '33cl', true, 'https://images.pexels.com/photos/8105/drinks-orange-juice-orange-vitamins.jpg?auto=compress&cs=tinysrgb&w=400'),
('SPRITE33C24', 'Sprite 33cl', 'soda', 'Sprite', 'C24', 500, 12000, 3000, 'Boisson gazeuse citron-lime', NULL, '33cl', true, 'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=400'),
('YOUKI33C24', 'Youki Orange 33cl', 'soda', 'Youki', 'C24', 450, 10800, 3000, 'Boisson gazeuse locale à l''orange', NULL, '33cl', true, 'https://images.pexels.com/photos/8105/drinks-orange-juice-orange-vitamins.jpg?auto=compress&cs=tinysrgb&w=400'),
('PEPSI33C24', 'Pepsi Cola 33cl', 'soda', 'Pepsi', 'C24', 500, 12000, 3000, 'Boisson gazeuse au cola', NULL, '33cl', true, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400'),

-- VINS
('VINROUGE75C12V', 'Vin Rouge de Table 75cl', 'vin', 'Cellier', 'C12V', 2500, 30000, 4000, 'Vin rouge de table français', 12.5, '75cl', true, 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400'),
('VINBLANC75C12V', 'Vin Blanc Sec 75cl', 'vin', 'Cellier', 'C12V', 2800, 33600, 4000, 'Vin blanc sec français', 11.5, '75cl', true, 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400'),
('MUSCADET75C12V', 'Muscadet Rouge 75cl', 'vin', 'Muscadet', 'C12V', 3000, 36000, 4000, 'Vin rouge français de qualité', 13.0, '75cl', true, 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400'),
('MUMM75C12V', 'Champagne Mumm 75cl', 'vin', 'Mumm', 'C12V', 25000, 300000, 4000, 'Champagne français premium', 12.0, '75cl', true, 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400'),

-- EAUX
('AWOULABA15C6', 'Eau Awoulaba 1.5L', 'eau', 'Awoulaba', 'C6', 400, 2400, 2000, 'Eau minérale naturelle de Côte d''Ivoire', NULL, '1.5L', true, 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400'),
('CRISTAL15C6', 'Eau Cristalline 1.5L', 'eau', 'Cristalline', 'C6', 350, 2100, 2000, 'Eau de source pure', NULL, '1.5L', true, 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400'),
('VOLTIC15C6', 'Voltic 1.5L', 'eau', 'Voltic', 'C6', 400, 2400, 2000, 'Eau minérale naturelle', NULL, '1.5L', true, 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400'),

-- SPIRITUEUX
('JOHNNIE70C12V', 'Johnnie Walker Red Label 70cl', 'spiritueux', 'Johnnie Walker', 'C12V', 15000, 180000, 4000, 'Whisky écossais de renommée mondiale', 40.0, '70cl', true, 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=400'),
('BOMBAY70C12V', 'Bombay Sapphire 70cl', 'spiritueux', 'Bombay', 'C12V', 18000, 216000, 4000, 'Gin premium aux botaniques', 40.0, '70cl', true, 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=400'),
('SMIRNOFF70C12V', 'Smirnoff Vodka 70cl', 'spiritueux', 'Smirnoff', 'C12V', 12000, 144000, 4000, 'Vodka premium triple distillée', 40.0, '70cl', true, 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=400'),
('BACARDI70C12V', 'Bacardi Blanc 70cl', 'spiritueux', 'Bacardi', 'C12V', 14000, 168000, 4000, 'Rhum blanc des Caraïbes', 37.5, '70cl', true, 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=400')

ON CONFLICT (reference) DO NOTHING;

-- Insertion des zones de livraison
INSERT INTO delivery_zones (commune_name, is_active, max_suppliers, minimum_coverage, operating_hours) VALUES
('Cocody', true, 10, 1, '18:00-06:00'),
('Plateau', true, 10, 1, '18:00-06:00'),
('Marcory', true, 10, 1, '18:00-06:00'),
('Treichville', true, 10, 1, '18:00-06:00'),
('Adjamé', true, 10, 1, '18:00-06:00'),
('Yopougon', true, 10, 1, '18:00-06:00'),
('Abobo', true, 10, 1, '18:00-06:00'),
('Koumassi', true, 10, 1, '18:00-06:00'),
('Port-Bouët', true, 10, 1, '18:00-06:00'),
('Attecoube', true, 10, 1, '18:00-06:00')
ON CONFLICT (commune_name) DO NOTHING;
