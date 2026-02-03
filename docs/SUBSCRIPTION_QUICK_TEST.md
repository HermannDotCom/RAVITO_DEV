# Guide de Test Rapide - Système d'Abonnement

Ce guide vous permet de tester rapidement le système d'abonnement Ravito Gestion.

## 🎯 Objectif

Vérifier que tout le flux d'abonnement fonctionne correctement :
1. Souscription avec essai gratuit
2. Affichage des factures
3. Validation de paiement par l'admin
4. Renouvellement

## 👤 Comptes de Test Nécessaires

Vous aurez besoin de :
- **1 compte Client** : Pour tester la souscription
- **1 compte Admin** : Pour valider les paiements

## 📝 Étape 1 : Souscription Client

### 1.1 Connexion Client

1. Connectez-vous avec un compte client
2. Dans le menu, cliquez sur **"Plus..."** ou ouvrez le menu secondaire
3. Cliquez sur **"Gestion Activité"**

**Résultat attendu** : Vous devriez voir le Paywall avec les 3 plans d'abonnement.

### 1.2 Choisir un Plan

1. Cliquez sur **"Choisir ce plan"** pour le plan Mensuel (6000 FCFA)
2. Vérifiez les informations :
   - Période d'essai : 30 jours gratuits
   - Prix : 6000 FCFA/mois
   - Montant au prorata affiché

**Résultat attendu** : Page de confirmation avec tous les détails.

### 1.3 Confirmer l'Abonnement

1. Cliquez sur **"Démarrer mon essai gratuit"**
2. Attendez quelques secondes

**Résultat attendu** :
- Toast de succès : "Abonnement créé avec succès"
- Redirection vers la page "Gestion Activité"
- Bannière verte affichant "30 jours restants"

### 1.4 Vérifier l'Accès

1. Naviguez dans les différents onglets :
   - Résumé
   - Mensuel
   - Annuel
   - Encaissements
   - Emballages
   - Stocks
   - Crédits

**Résultat attendu** : Tous les onglets sont accessibles.

## 💳 Étape 2 : Voir Mon Abonnement

### 2.1 Accéder à la Page

1. Menu → Plus... → **"Mon Abonnement"**

**Résultat attendu** :
- Badge vert "Période d'essai - 30 jours restants"
- Détails du plan Mensuel
- Aucune facture en attente (pendant l'essai)

## 🔧 Étape 3 : Vérification Admin

### 3.1 Connexion Admin

1. Déconnectez-vous du compte client
2. Connectez-vous avec un compte admin
3. Menu → **"Gestion d'abonnements"**

**Résultat attendu** : Page avec 4 onglets (Abonnés, Factures, Plans, Paramètres)

### 3.2 Onglet Abonnés

1. Cliquez sur l'onglet **"Abonnés"**

**Résultat attendu** :
- Liste des abonnés
- Le client que vous venez de créer apparaît
- Statut : "Essai gratuit"
- Badge vert avec nombre de jours restants

### 3.3 Onglet Plans

1. Cliquez sur l'onglet **"Plans"**

**Résultat attendu** :
- 3 plans : Mensuel, Semestriel, Annuel
- Prix : 6000, 30000, 50000 FCFA
- Tous actifs (badge vert)

## ⏰ Étape 4 : Simuler Fin d'Essai (Optionnel)

Pour tester rapidement sans attendre 30 jours, modifiez manuellement la base de données :

```sql
-- Trouver l'abonnement du client
SELECT id, trial_end_date, status
FROM subscriptions
WHERE status = 'trial'
ORDER BY created_at DESC
LIMIT 1;

-- Faire expirer l'essai (remplacez SUBSCRIPTION_ID par l'ID réel)
UPDATE subscriptions
SET trial_end_date = NOW() - INTERVAL '1 day'
WHERE id = 'SUBSCRIPTION_ID';

-- Créer une facture manuellement
INSERT INTO subscription_invoices (
  subscription_id,
  invoice_number,
  amount,
  prorata_amount,
  days_calculated,
  is_prorata,
  period_start,
  period_end,
  due_date,
  status
) VALUES (
  'SUBSCRIPTION_ID',
  'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-TEST',
  6000,
  6000,
  30,
  true,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '7 days',
  'pending'
);
```

### 4.1 Voir la Facture (Client)

1. Reconnectez-vous avec le compte client
2. Menu → Plus... → **"Mon Abonnement"**

**Résultat attendu** :
- Section "Factures en attente" visible
- Facture avec montant 6000 FCFA
- Instructions de paiement (Espèces, Wave, Orange Money, MTN Money)
- Bouton "Contacter le support après paiement"

### 4.2 Valider le Paiement (Admin)

1. Reconnectez-vous avec le compte admin
2. Menu → **"Gestion d'abonnements"** → Onglet **"Factures"**

**Résultat attendu** :
- La facture du client apparaît dans "Factures en attente"
- Bouton "Valider le paiement"

3. Cliquez sur **"Valider le paiement"**
4. Remplissez le formulaire :
   - Mode de paiement : Cash (ou autre)
   - Montant : 6000
   - Référence : TEST-001
   - Notes : "Test de validation"

5. Cliquez sur **"Valider"**

**Résultat attendu** :
- Toast de succès
- La facture passe dans "Factures payées"
- L'abonnement du client passe en statut "Actif"

### 4.3 Vérifier le Statut (Client)

1. Reconnectez-vous avec le compte client
2. Menu → Plus... → **"Mon Abonnement"**

**Résultat attendu** :
- Badge vert "Abonnement actif"
- Section "Historique des paiements" avec la facture payée
- Badge "Payée" vert sur la facture

## ✅ Checklist de Validation

Cochez chaque élément une fois testé :

### Côté Client
- [ ] Paywall s'affiche correctement
- [ ] Sélection d'un plan fonctionne
- [ ] Confirmation affiche le prorata
- [ ] Création d'abonnement réussie
- [ ] Accès au module "Gestion Activité"
- [ ] Bannière essai gratuit visible
- [ ] Page "Mon Abonnement" accessible
- [ ] Facture visible après expiration essai
- [ ] Instructions de paiement claires
- [ ] Historique des paiements visible

### Côté Admin
- [ ] Page "Gestion d'abonnements" accessible
- [ ] Liste des abonnés affichée
- [ ] Statuts corrects (Essai / Actif / Suspendu)
- [ ] Liste des factures affichée
- [ ] Validation de paiement fonctionne
- [ ] Facture passe en "Payée"
- [ ] Plans modifiables
- [ ] Activation/désactivation de plans

### Automatisations (si configurées)
- [ ] Rappels de fin d'essai envoyés
- [ ] Rappels de paiement envoyés
- [ ] Suspension automatique après essai
- [ ] Factures marquées "en retard"

## 🐛 Problèmes Courants

### La facture n'apparaît pas

**Solution** : Vérifiez que l'abonnement est bien expiré :
```sql
SELECT * FROM subscriptions WHERE id = 'SUBSCRIPTION_ID';
```

### Le paiement ne valide pas la facture

**Solution** : Vérifiez les RLS policies :
```sql
-- Tester en tant que super admin
SELECT * FROM subscription_invoices WHERE status = 'pending';
```

### Le module reste bloqué après paiement

**Solution** : Vérifiez le statut de l'abonnement :
```sql
UPDATE subscriptions
SET status = 'active'
WHERE id = 'SUBSCRIPTION_ID';
```

## 📊 Données de Test

### Plans Configurés
- **Mensuel** : 6 000 FCFA/mois
- **Semestriel** : 30 000 FCFA/semestre (5 000/mois)
- **Annuel** : 50 000 FCFA/an (4 167/mois)

### Périodes d'Essai
- Durée : 30 jours
- Gratuit : Oui
- Suspension auto : Oui

## 🎓 Test Complet Réussi

Si tous les points de la checklist sont validés, votre système d'abonnement est **opérationnel** !

Vous pouvez maintenant :
1. Déployer en production
2. Configurer le cron job pour les rappels
3. Former vos équipes sur le processus
4. Communiquer auprès de vos clients

## 📞 Support

En cas de problème, vérifiez :
1. Les logs de la console navigateur (F12)
2. Les logs Supabase
3. Les politiques RLS
4. La configuration des plans

Bon test ! 🚀
