# Guide de Test End-to-End Complet - DISTRI-NIGHT

## État Actuel du Système

**Date:** 31 Octobre 2025
**Statut:** ✅ Base de données réinitialisée
**Build:** ✅ Réussi en 7.36s

### Réinitialisation Effectuée

Toutes les données transactionnelles ont été supprimées:
- ✅ 0 commandes (orders)
- ✅ 0 items de commandes (order_items)
- ✅ 0 offres fournisseurs (supplier_offers)
- ✅ 0 évaluations (ratings)
- ✅ Notifications liées nettoyées

**Données préservées:**
- ✅ Utilisateurs (clients, fournisseurs, admin)
- ✅ Produits (boissons)
- ✅ Zones de livraison
- ✅ Zones approuvées pour fournisseurs

---

## Flux Complet du Processus de Commande

### Vue d'Ensemble des Statuts

```
FLUX CLIENT → FOURNISSEUR → CLIENT → ÉVALUATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. pending-offers          ← Client crée commande
2. offers-received         ← Fournisseur envoie offre(s)
3. awaiting-payment        ← Client accepte une offre
4. paid                    ← Client paye
5. accepted                ← Système valide paiement
6. preparing               ← Fournisseur prépare
7. delivering              ← Fournisseur en livraison
8. delivered               ← Fournisseur confirme livraison
9. awaiting-rating         ← Système demande évaluations
10. completed              ← Les 2 ont évalué
```

### Statuts et Responsabilités

| Statut | Acteur | Action | Transition Suivante |
|--------|--------|--------|---------------------|
| `pending-offers` | Client | Crée commande | → `offers-received` |
| `offers-received` | Fournisseur | Envoie offre(s) | → `awaiting-payment` |
| `awaiting-payment` | Client | Accepte offre | → `paid` |
| `paid` | Client | Effectue paiement | → `accepted` |
| `accepted` | Système | Auto (après paiement) | → `preparing` |
| `preparing` | Fournisseur | Prépare commande | → `delivering` |
| `delivering` | Fournisseur | Part en livraison | → `delivered` |
| `delivered` | Fournisseur | Confirme livraison | → `awaiting-rating` |
| `awaiting-rating` | Client + Fournisseur | Évaluent | → `completed` |
| `completed` | Système | Auto (2 évaluations) | FIN |

---

## Protocole de Test End-to-End

### Phase 1: Préparation des Comptes

#### Étape 1.1: Vérifier Utilisateurs Existants

**Console navigateur (ou vérifier fichiers):**
- `TEST_ACCOUNTS.md`
- `CREDENTIALS.txt`

**Comptes requis:**
- 1 Client (ex: client@test.com)
- 2 Fournisseurs (ex: supplier@test.com, supplier2@test.com)
- 1 Admin (ex: admin@test.com)

#### Étape 1.2: Vérifier Zones Fournisseurs

**SQL à exécuter:**
```sql
SELECT
  p.email,
  sz.zone_id,
  z.name as zone_name,
  sz.approval_status
FROM profiles p
JOIN supplier_zones sz ON sz.supplier_id = p.id
JOIN zones z ON z.id = sz.zone_id
WHERE p.role = 'supplier'
AND sz.approval_status = 'approved';
```

**Attendu:** Chaque fournisseur a au moins 1 zone approuvée.

---

### Phase 2: Test Création Commande Client

#### Étape 2.1: Connexion Client

1. Ouvrir application
2. Se connecter avec compte client
3. Aller sur "Catalogue de Produits"

#### Étape 2.2: Ajout Produits au Panier

1. **Ajouter 3-5 produits différents:**
   - Exemple:
     - 2x Flag Spéciale 33cl
     - 3x Castel 66cl
     - 1x Coca-Cola 33cl

2. **Vérifier panier:**
   - Icône panier affiche nombre d'items
   - Total calculé correctement

3. **Options consigne:**
   - Tester avec et sans consigne
   - Vérifier que le prix change

#### Étape 2.3: Checkout

1. Cliquer sur panier
2. Cliquer "Procéder au paiement"

**Formulaire checkout:**
- [ ] Sélectionner zone de livraison (ex: Cocody)
- [ ] Entrer adresse complète
- [ ] Sélectionner mode de paiement
- [ ] Vérifier récapitulatif:
  - Sous-total produits
  - Consigne
  - Commission client (+8%)
  - Total

3. Cliquer "Confirmer la commande"

**Attendu:**
- ✅ Message succès
- ✅ Panier vidé
- ✅ Redirection vers "Mes Commandes"

#### Étape 2.4: Vérifier Commande Créée

**Interface Client - Mes Commandes:**
- [ ] Commande visible
- [ ] Statut: `En attente d'offres`
- [ ] Montant correct
- [ ] Produits listés

**Base de Données:**
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
SELECT * FROM order_items WHERE order_id = '<order-id>';
```

**Attendu:**
- `status = 'pending-offers'`
- `supplier_id = NULL`
- `order_items` contient les produits

---

### Phase 3: Test Offres Fournisseur

#### Étape 3.1: Connexion Fournisseur 1

1. **Se déconnecter** du compte client
2. **Se connecter** avec fournisseur (ex: supplier@test.com)
3. Aller sur "Commandes Disponibles"

#### Étape 3.2: Vérifier Commandes Disponibles

**Liste:**
- [ ] Commande du client visible
- [ ] Zone affichée (ex: Cocody)
- [ ] Montant total affiché
- [ ] **Nombre de produits affiché** (ex: "5 produits commandés")
- [ ] Distance et temps estimé

**Console navigateur (F12):**
```
Logs attendus:
📦 getPendingOrders - Raw data from DB: [...]
📦 Number of orders: 1
📦 First order order_items: [{...}, {...}]
🔄 order_items count: 5
✅ Mapped order: ... items: 5
```

**Si "0 produit commandé":**
- ❌ PROBLÈME - Les items ne sont pas chargés
- Vérifier logs console pour erreurs

#### Étape 3.3: Créer Offre Fournisseur

1. **Cliquer "Voir détails"**

**Modal ouvert:**
- [ ] Zone de livraison affichée
- [ ] Note: "Adresse exacte après acceptation"
- [ ] **Section "Produits demandés" remplie**
- [ ] Tous les produits listés avec:
  - Nom du produit
  - Quantité demandée
  - Prix unitaire
  - Boutons +/- et input

**Si section "Produits demandés" vide:**
- ❌ PROBLÈME CRITIQUE - RLS ou vue non sécurisée
- Voir `DIAGNOSTIC_EXPERT_PRODUITS_INVISIBLES.md`

2. **Ajuster quantités (optionnel):**
   - Cliquer [-] sur un produit
   - Vérifier que prix se recalcule
   - Vérifier message "Vous proposez: X" apparaît

3. **Ajouter message au client (optionnel):**
   ```
   "Produits disponibles. Livraison possible sous 30min."
   ```

4. **Vérifier récapitulatif financier:**
   - Sous-total
   - Consigne
   - Commission client (+8%)
   - Commission fournisseur (-2%)
   - **Vous recevrez:** montant net
   - **Total client:** montant final

5. **Cliquer "Envoyer l'offre"**

**Attendu:**
- ✅ Message succès
- ✅ Modal se ferme
- ✅ Commande disparaît de "Commandes Disponibles"

#### Étape 3.4: (Optionnel) Offre Fournisseur 2

1. **Se déconnecter** fournisseur 1
2. **Se connecter** fournisseur 2
3. Répéter étapes 3.2-3.3
4. Créer une offre différente (prix/quantités)

**Résultat:**
- Client aura 2 offres à comparer

---

### Phase 4: Test Acceptation Offre Client

#### Étape 4.1: Retour Client

1. **Se déconnecter** fournisseur
2. **Se connecter** client
3. Aller sur "Mes Commandes"

#### Étape 4.2: Vérifier Offres Reçues

**Liste commandes:**
- [ ] Statut changé: `Offres reçues` ou badge "Nouvelles offres"
- [ ] Cliquer sur la commande

**Détails commande:**
- [ ] Section "Offres reçues" visible
- [ ] 1 ou 2 offres listées
- [ ] Pour chaque offre:
  - Nom fournisseur
  - Note moyenne fournisseur
  - Montant proposé
  - Message fournisseur (si présent)
  - Boutons "Accepter" et "Refuser"

#### Étape 4.3: Accepter une Offre

1. **Comparer les offres** (si plusieurs)
2. **Cliquer "Accepter"** sur l'offre choisie

**Modal confirmation:**
- [ ] Détails offre affichés
- [ ] Produits ajustés visibles
- [ ] Montant total
- [ ] Bouton "Confirmer l'acceptation"

3. **Cliquer "Confirmer l'acceptation"**

**Attendu:**
- ✅ Message succès
- ✅ Statut commande → `En attente de paiement`
- ✅ Fournisseur assigné

**Base de données:**
```sql
SELECT
  status,
  supplier_id,
  total_amount,
  supplier_commission,
  net_supplier_amount
FROM orders
WHERE id = '<order-id>';
```

**Attendu:**
- `status = 'awaiting-payment'`
- `supplier_id` = ID fournisseur choisi
- Montants mis à jour selon l'offre

---

### Phase 5: Test Paiement

#### Étape 5.1: Simuler Paiement

**Interface Client:**
1. Sur page détails commande
2. Section "Paiement" visible
3. Bouton "Procéder au paiement"

**Note:** Le système actuel simule le paiement.

4. Cliquer "Procéder au paiement"

**Attendu:**
- ✅ Statut → `Payée` puis `Acceptée`
- ✅ Message confirmation

**Base de données:**
```sql
SELECT status, payment_status, paid_at
FROM orders
WHERE id = '<order-id>';
```

**Attendu:**
- `status = 'accepted'`
- `payment_status = 'paid'`
- `paid_at` = timestamp actuel

---

### Phase 6: Test Préparation et Livraison

#### Étape 6.1: Fournisseur Prépare

1. **Se connecter** en fournisseur assigné
2. Aller sur "Livraisons en Cours"

**Liste:**
- [ ] Commande payée visible
- [ ] Statut: `Acceptée`
- [ ] Détails client visibles (adresse complète maintenant)

3. **Cliquer sur la commande**
4. **Bouton "Commencer la préparation"**
5. Cliquer bouton

**Attendu:**
- ✅ Statut → `En préparation`

#### Étape 6.2: Fournisseur Part en Livraison

1. **Sur même commande**
2. **Bouton "Partir en livraison"** (ou "Démarrer la livraison")
3. Cliquer bouton

**Attendu:**
- ✅ Statut → `En livraison`
- ✅ Notification client

#### Étape 6.3: Fournisseur Confirme Livraison

1. **Sur même commande**
2. **Bouton "Confirmer la livraison"**
3. Cliquer bouton

**Attendu:**
- ✅ Statut → `Livrée`
- ✅ Timestamp `delivered_at` enregistré

---

### Phase 7: Test Système d'Évaluation

#### Étape 7.1: Vérifier Déclenchement Évaluations

**Base de données:**
```sql
SELECT status FROM orders WHERE id = '<order-id>';
```

**Attendu après livraison:**
- `status = 'delivered'`

**Mécanisme:** Le système devrait passer automatiquement à `awaiting-rating` ou le faire manuellement:

**Option 1 - Automatique (si trigger existe):**
```sql
UPDATE orders
SET status = 'awaiting-rating'
WHERE id = '<order-id>' AND status = 'delivered';
```

**Option 2 - Manuel pour test:**
```sql
UPDATE orders
SET status = 'awaiting-rating'
WHERE id = '<order-id>';
```

#### Étape 7.2: Client Évalue Fournisseur

1. **Connecté en client**
2. **Se rendre sur "Mes Commandes"**
3. **La commande devrait afficher:**
   - Badge "À évaluer"
   - Bouton "Évaluer"

**Si bloquage pour nouvelle action:**
- ✅ Modal "Évaluations en attente" s'affiche
- ✅ Message: "Vous devez évaluer votre dernière transaction"

4. **Cliquer "Évaluer"**

**Formulaire d'évaluation:**
- [ ] Notes (1-5 étoiles):
  - Ponctualité
  - Qualité des produits
  - Communication
- [ ] Commentaire (optionnel)
- [ ] Récapitulatif commande

5. **Donner notes** (ex: 5/5/5)
6. **Ajouter commentaire:** "Excellent service, livraison rapide!"
7. **Cliquer "Soumettre l'évaluation"**

**Attendu:**
- ✅ Message succès
- ✅ Évaluation enregistrée

**Base de données:**
```sql
SELECT * FROM ratings
WHERE order_id = '<order-id>'
AND from_user_role = 'client';
```

**Attendu:**
- 1 rating créé
- `overall` = moyenne des 3 notes

#### Étape 7.3: Fournisseur Évalue Client

1. **Se déconnecter** client
2. **Se connecter** fournisseur
3. **Aller sur "Historique"** ou page commandes complétées
4. **Trouver la commande**
5. **Cliquer "Évaluer le client"**

**Formulaire similaire:**
- [ ] Ponctualité (respect RDV)
- [ ] Qualité échange
- [ ] Communication

6. **Donner notes** (ex: 5/5/5)
7. **Cliquer "Soumettre"**

**Attendu:**
- ✅ Message succès
- ✅ 2e évaluation enregistrée

**Base de données:**
```sql
SELECT * FROM ratings
WHERE order_id = '<order-id>';
```

**Attendu:**
- 2 ratings (client → fournisseur, fournisseur → client)

#### Étape 7.4: Vérifier Statut Final

**Base de données:**
```sql
SELECT status FROM orders WHERE id = '<order-id>';
```

**Attendu:**
- Si logique automatique: `status = 'completed'`
- Sinon reste: `status = 'awaiting-rating'`

**Si reste awaiting-rating, forcer manuellement:**
```sql
UPDATE orders
SET status = 'completed'
WHERE id = '<order-id>';
```

---

### Phase 8: Vérifications Admin

#### Étape 8.1: Vue Admin Globale

1. **Se connecter** admin
2. **Dashboard Admin**

**Sections à vérifier:**
- [ ] **Analytics:**
  - Total commandes: 1
  - Commandes complétées: 1
  - Revenus totaux
  - Graphiques

- [ ] **Gestion Commandes:**
  - Liste toutes commandes
  - Détails complets
  - Historique statuts

- [ ] **Gestion Utilisateurs:**
  - Stats client: 1 commande
  - Stats fournisseur: 1 livraison
  - Évaluations moyennes affichées

#### Étape 8.2: Trésorerie

**Page "Trésorerie":**
- [ ] Commande complétée listée
- [ ] Montants:
  - Total client payé
  - Commission plateforme
  - À transférer au fournisseur
- [ ] Statut transfert

---

## Tests de Régression

### Test 1: Système de Blocage Évaluations

**Objectif:** Vérifier qu'un utilisateur avec évaluation en attente est bloqué.

**Scénario:**
1. Client avec commande en `awaiting-rating` (pas encore évalué)
2. Tente de créer une nouvelle commande

**Attendu:**
- ❌ Modal "Évaluations en attente" s'affiche
- ❌ Bloqué tant que pas évalué

**Même test pour fournisseur:**
1. Fournisseur avec commande en `awaiting-rating`
2. Tente d'accepter une nouvelle commande

**Attendu:**
- ❌ Erreur: "Vous devez d'abord évaluer..."

### Test 2: Offres Multiples

**Scénario:**
1. Client crée commande
2. Fournisseur 1 envoie offre A
3. Fournisseur 2 envoie offre B
4. Client accepte offre A

**Attendu:**
- ✅ Offre A: `status = 'accepted'`
- ✅ Offre B: `status = 'rejected'` (auto)
- ✅ Commande assignée au fournisseur 1

### Test 3: Ajustements Quantités

**Scénario:**
1. Client commande: 10 Flag + 5 Castel
2. Fournisseur ajuste: 7 Flag + 5 Castel
3. Client accepte
4. Vérifier order_items final

**Attendu:**
- ✅ `order_items` mis à jour avec quantités fournisseur
- ✅ Ancien items supprimés
- ✅ Nouveaux items insérés

### Test 4: Annulation Commande

**Scénario:**
1. Commande en `pending-offers`
2. Client annule

**Attendu:**
- ✅ Statut → `cancelled`
- ✅ N'apparaît plus pour fournisseurs

---

## Checklist Validation Complète

### ✅ Fonctionnalités Client

- [ ] Créer compte client
- [ ] Parcourir catalogue produits
- [ ] Ajouter/retirer produits panier
- [ ] Gérer consigne
- [ ] Sélectionner zone livraison
- [ ] Passer commande
- [ ] Voir historique commandes
- [ ] Recevoir offres fournisseurs
- [ ] Comparer offres
- [ ] Accepter/refuser offre
- [ ] Effectuer paiement
- [ ] Suivre statut commande
- [ ] Évaluer fournisseur
- [ ] Voir ses propres évaluations

### ✅ Fonctionnalités Fournisseur

- [ ] Créer compte fournisseur
- [ ] Demander zones de couverture
- [ ] Voir commandes disponibles dans ses zones
- [ ] Voir détails commande (produits, zone)
- [ ] Créer offre (ajuster quantités)
- [ ] Ajouter message au client
- [ ] Voir offres envoyées
- [ ] Recevoir notification acceptation
- [ ] Voir adresse complète (après acceptation)
- [ ] Préparer commande
- [ ] Partir en livraison
- [ ] Confirmer livraison
- [ ] Évaluer client
- [ ] Voir statistiques (livraisons, notes)

### ✅ Fonctionnalités Admin

- [ ] Vue globale analytics
- [ ] Gérer utilisateurs
- [ ] Approuver fournisseurs
- [ ] Gérer zones
- [ ] Approuver demandes zones fournisseurs
- [ ] Voir toutes commandes
- [ ] Gérer trésorerie
- [ ] Voir commissions
- [ ] Gérer tickets support

### ✅ Système

- [ ] Authentification JWT
- [ ] RLS (Row Level Security)
- [ ] Notifications temps réel
- [ ] Calcul commissions automatique
- [ ] Transitions statuts cohérentes
- [ ] Blocage évaluations en attente
- [ ] Logs console détaillés
- [ ] Gestion erreurs

---

## Problèmes Connus et Solutions

### Problème 1: Produits Non Visibles

**Symptôme:** "0 produit commandé" dans interface fournisseur

**Cause:** Vue PostgreSQL sans `security_invoker = true`

**Solution:** Migration `20251026_add_rls_to_orders_view.sql` appliquée

**Vérification:**
```sql
SELECT c.relname, c.reloptions
FROM pg_class c
WHERE c.relname = 'orders_with_coords';
-- Attendu: reloptions = {security_invoker=true}
```

### Problème 2: Ordre Items Manquants

**Symptôme:** Commande créée mais `order_items` vide

**Diagnostic:**
```sql
SELECT
  o.id,
  COUNT(oi.id) as nb_items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = '<order-id>'
GROUP BY o.id;
```

**Si nb_items = 0:**
- Problème lors de la création (transaction échouée)
- Vérifier console logs frontend

### Problème 3: Fonction has_pending_ratings Erreur

**Symptôme:** Erreur lors de création offre ou acceptation

**Vérification:**
```sql
SELECT has_pending_ratings('<user-id>');
```

**Si erreur:**
- Fonction n'existe pas
- Créer la fonction (voir migrations)

---

## Données de Test Recommandées

### Produits à Commander

**Mix réaliste:**
- 2-3 types de bières (Flag, Castel, Beaufort)
- 1 soft drink (Coca, Fanta)
- 1 eau

**Quantités:**
- Petite commande: 5-10 caisses totales
- Moyenne: 15-30 caisses
- Grande: 50+ caisses

### Zones à Utiliser

**Zones urbaines:**
- Cocody (zone premium)
- Plateau (centre d'affaires)
- Marcory (résidentiel)

**Zones périphériques:**
- Abobo
- Yopougon

### Timing Tests

**Durée test complet E2E:**
- Préparation: 5 min
- Client crée commande: 3 min
- Fournisseur envoie offre: 3 min
- Client accepte et paye: 2 min
- Livraison (simulation): 2 min
- Évaluations: 3 min
- Vérifications admin: 5 min

**Total:** ~23 minutes pour 1 cycle complet

---

## Résultats Attendus Finaux

### Base de Données

```sql
-- Commande complétée
SELECT * FROM orders WHERE status = 'completed';

-- Items finaux (quantités fournisseur)
SELECT * FROM order_items WHERE order_id = '<order-id>';

-- Offres (1 acceptée, autres rejetées)
SELECT * FROM supplier_offers WHERE order_id = '<order-id>';

-- Évaluations (2 ratings)
SELECT * FROM ratings WHERE order_id = '<order-id>';
```

### Statistiques

**Client:**
- Commandes totales: 1
- Note moyenne reçue: 5.0

**Fournisseur:**
- Livraisons: 1
- Note moyenne: 5.0
- Temps livraison moyen: calculé

**Plateforme:**
- GMV (Gross Merchandise Value): montant commande
- Commission client collectée: 8%
- Commission fournisseur: 2%

---

## Commandes SQL Utiles pour Debug

### Voir État Complet d'une Commande

```sql
SELECT
  o.id,
  o.status,
  o.client_id,
  o.supplier_id,
  o.total_amount,
  o.created_at,
  o.delivered_at,
  COUNT(oi.id) as nb_items,
  COUNT(so.id) as nb_offers,
  COUNT(r.id) as nb_ratings
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN supplier_offers so ON so.order_id = o.id
LEFT JOIN ratings r ON r.order_id = o.id
WHERE o.id = '<order-id>'
GROUP BY o.id;
```

### Voir Toutes les Transitions de Statut

Si un champ `updated_at` existe ou via logs:
```sql
SELECT
  id,
  status,
  updated_at,
  created_at
FROM orders
ORDER BY created_at DESC;
```

### Vérifier Intégrité Évaluations

```sql
-- Commandes livrées sans évaluations complètes
SELECT
  o.id,
  o.status,
  COUNT(r.id) as nb_ratings
FROM orders o
LEFT JOIN ratings r ON r.order_id = o.id
WHERE o.status IN ('delivered', 'awaiting-rating', 'completed')
GROUP BY o.id
HAVING COUNT(r.id) < 2;
```

---

## Conclusion

### État Système: ✅ PRÊT POUR TEST

**Réinitialisation:** ✅ Effectuée
**Build:** ✅ Réussi
**Documentation:** ✅ Complète

### Prochaines Étapes

1. **Rafraîchir l'application** (Ctrl+F5)
2. **Suivre ce guide étape par étape**
3. **Documenter tout problème rencontré**
4. **Vérifier chaque case de la checklist**

### Support

**En cas de problème:**
- Vérifier console navigateur (F12)
- Vérifier logs serveur Supabase
- Exécuter requêtes SQL de diagnostic
- Consulter `DIAGNOSTIC_EXPERT_PRODUITS_INVISIBLES.md`

**Fichiers de référence:**
- `FIX_PRODUCTS_NOT_SHOWING.md`
- `SUPPLIER_FIXES_COMPLETE.md`
- `TEST_ACCOUNTS.md`
- `CREDENTIALS.txt`

---

**Date de création:** 31 Octobre 2025
**Version:** 1.0
**Validé pour:** Production Test Environment

✅ **Système prêt pour validation E2E complète**
