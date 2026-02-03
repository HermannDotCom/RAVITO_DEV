# Guide de Test : Flux Complet d'Abonnement Ravito Gestion

## 🔍 Comprendre le Flux

Le système fonctionne en **3 étapes principales** :

### Étape 1 : Premier Accès (Nouveau Client)
Quand un **nouveau client** clique sur "Gestion Activité", il voit le **Paywall** car il n'a pas encore d'abonnement.

### Étape 2 : Création d'Abonnement
Le client choisit un plan et crée son abonnement → Il obtient **30 jours d'essai gratuit**

### Étape 3 : Gestion d'Abonnement
Une fois l'abonnement créé, le client peut :
- Accéder au module "Gestion Activité" (avec bannière d'essai)
- Voir ses factures dans "Mon Abonnement"

---

## 📋 Test Étape par Étape

### Test 1 : Nouveau Client Sans Abonnement

**Objectif** : Vérifier que le Paywall s'affiche correctement

1. **Se connecter** avec un compte client test (ou créer un nouveau compte)

2. **Cliquer sur "Gestion Activité"** (juste après "Accueil" dans la sidebar)
   - ✅ Vous devriez voir le **Paywall** avec les 3 plans :
     - Mensuel : 6 000 FCFA
     - Semestriel : 30 000 FCFA
     - Annuel : 50 000 FCFA

3. **Cliquer sur "Plus..."** → **"Mon Abonnement"**
   - ✅ Vous devriez AUSSI voir le **Paywall** (car pas encore d'abonnement)

**Résultat attendu** : C'est **NORMAL** de voir le Paywall dans les deux cas quand vous n'avez pas d'abonnement !

---

### Test 2 : Création d'un Abonnement

**Objectif** : Créer un abonnement et obtenir l'essai gratuit

1. Sur le **Paywall**, **choisir un plan** (par exemple "Mensuel")

2. Vous êtes redirigé vers la **page de confirmation** avec :
   - ✅ Détails du plan sélectionné
   - ✅ Badge "1 MOIS GRATUIT OFFERT"
   - ✅ Calcul du montant au prorata après l'essai
   - ✅ Modes de paiement (Cash, Wave, Orange, MTN)

3. **Cliquer sur "Démarrer mon essai gratuit"**
   - ✅ Toast de confirmation : "Abonnement créé avec succès !"
   - ✅ Redirection automatique vers "Gestion Activité"

---

### Test 3 : Accès au Module avec Essai Gratuit

**Objectif** : Vérifier l'accès pendant la période d'essai

1. **Cliquer sur "Gestion Activité"** dans la sidebar
   - ✅ Vous voyez maintenant une **bannière verte** :
     - "Période d'essai : 30 jours restants"
     - Bouton "Voir les offres"
   - ✅ Vous pouvez accéder au module complet

2. **Tester toutes les fonctionnalités** du module

---

### Test 4 : Page "Mon Abonnement"

**Objectif** : Vérifier la gestion d'abonnement

1. **Cliquer sur "Plus..."** → **"Mon Abonnement"**

2. Vous devriez maintenant voir la **Page de Gestion d'Abonnement** (plus le Paywall !)

   **Section 1 : Statut**
   - ✅ Badge vert : "Période d'essai - 30 jours restants"
   - ✅ Détails du plan choisi
   - ✅ Prix et cycle de facturation

   **Section 2 : Factures en attente**
   - ⚠️ Vide pour l'instant (les factures sont créées après l'essai)

   **Section 3 : Historique des paiements**
   - ⚠️ Vide pour l'instant

3. **Bouton Retour** pour revenir au dashboard

---

### Test 5 : Simulation de Fin d'Essai (Admin uniquement)

**Objectif** : Tester le flux après la période d'essai

**Note** : Cette étape nécessite d'être admin pour modifier la base de données.

1. **Se connecter en tant qu'Admin**

2. **Ouvrir Supabase Dashboard** → SQL Editor

3. **Exécuter cette requête** pour simuler la fin d'essai :

```sql
-- Remplacer 'USER_ID' par l'ID du client test
UPDATE subscriptions
SET
  trial_end_date = NOW() - INTERVAL '1 day',
  status = 'pending_payment'
WHERE user_id = 'USER_ID';

-- Créer une facture de test
INSERT INTO subscription_invoices (
  subscription_id,
  invoice_number,
  amount,
  status,
  period_start,
  period_end,
  due_date,
  is_prorata
)
SELECT
  id,
  'INV-TEST-' || FLOOR(RANDOM() * 10000),
  (SELECT price FROM subscription_plans WHERE id = plan_id),
  'pending',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW() + INTERVAL '7 days',
  true
FROM subscriptions
WHERE user_id = 'USER_ID';
```

4. **Se reconnecter en tant que Client**

5. **Aller sur "Mon Abonnement"**
   - ✅ Badge orange : "En attente de paiement"
   - ✅ Section **"Factures en attente"** visible avec :
     - Montant à payer
     - Date d'échéance
     - Instructions de paiement détaillées
     - Bouton "Contacter le support après paiement"

6. **Tenter d'accéder à "Gestion Activité"**
   - ✅ Message : "Paiement en attente"
   - ✅ Module accessible mais avec avertissement

---

### Test 6 : Validation Admin d'un Paiement

**Objectif** : Valider un paiement en tant qu'admin

1. **Se connecter en tant qu'Admin**

2. **Aller sur "Gestion d'abonnements"** → Onglet **"Factures"**

3. **Onglet "En attente"**
   - ✅ Voir la facture du client test

4. **Cliquer sur "Valider le paiement"**

5. **Remplir le formulaire** :
   - Mode de paiement : Wave (ou autre)
   - Montant : (pré-rempli)
   - Référence : TEST-12345
   - Notes : Test de validation

6. **Cliquer sur "Valider le paiement"**
   - ✅ Toast : "Paiement validé avec succès"
   - ✅ Facture passe en "Payée"
   - ✅ L'abonnement du client passe en "Actif"

7. **Se reconnecter en tant que Client**

8. **Vérifier "Mon Abonnement"**
   - ✅ Badge vert : "Abonnement actif"
   - ✅ Prochaine date de facturation affichée
   - ✅ Facture dans l'"Historique des paiements"

---

## ✅ Checklist Complète

### Flux Nouveau Client
- [ ] Paywall s'affiche sur "Gestion Activité"
- [ ] Paywall s'affiche sur "Mon Abonnement"
- [ ] Création d'abonnement fonctionne
- [ ] Redirection automatique après création

### Flux Essai Gratuit
- [ ] Bannière "30 jours restants" visible
- [ ] Accès complet au module
- [ ] Compteur de jours décrémente correctement

### Flux Fin d'Essai
- [ ] Facture créée automatiquement
- [ ] Badge "En attente de paiement"
- [ ] Instructions de paiement affichées
- [ ] Bouton support fonctionnel

### Flux Admin
- [ ] Liste des factures en attente
- [ ] Formulaire de validation accessible
- [ ] Validation met à jour l'abonnement
- [ ] Historique des paiements visible

---

## 🐛 Problèmes Courants

### "Je vois toujours le Paywall sur Mon Abonnement"
**Cause** : Vous n'avez pas encore créé d'abonnement
**Solution** : Créez d'abord un abonnement depuis "Gestion Activité"

### "Le module Gestion Activité ne s'affiche pas"
**Cause** : Le SubscriptionGuard bloque l'accès
**Solution** : Vérifiez que vous avez un abonnement actif ou en essai

### "Les factures ne s'affichent pas"
**Cause** : Aucune facture créée (normale pendant l'essai)
**Solution** : Attendez la fin de l'essai ou simulez-la (voir Test 5)

### "L'essai ne démarre pas"
**Cause** : Erreur lors de la création
**Solution** : Vérifiez les logs de la console navigateur et les erreurs Supabase

---

## 📊 Résultat Attendu Final

Après tous les tests, vous devriez avoir :

1. ✅ Un client avec abonnement actif
2. ✅ Une facture payée dans l'historique
3. ✅ Accès complet au module "Gestion Activité"
4. ✅ Date de prochaine facturation affichée
5. ✅ Système de rappels configuré (via cron)

---

## 🎯 Prochaines Étapes

1. **Configurer le cron job** (voir `SUBSCRIPTION_CRON_SETUP.md`)
2. **Tester les rappels automatiques**
3. **Former l'équipe admin** sur la validation des paiements
4. **Communiquer avec les clients** sur le nouveau système

---

## 💡 Astuces

- **Testez avec plusieurs plans** pour vérifier le calcul du prorata
- **Testez les différents statuts** (actif, suspendu, en attente)
- **Vérifiez les notifications** dans la page Notifications
- **Surveillez les logs Supabase** pour détecter les erreurs
