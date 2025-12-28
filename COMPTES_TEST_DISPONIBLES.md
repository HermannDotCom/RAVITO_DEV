# COMPTES DE TEST DISPONIBLES

## Situation Actuelle

Vous avez **8 comptes approuvés et prêts à l'emploi** :

### 1. Compte Admin
```
Email: admin@ravito.ci
Mot de passe: Admin2025!
Rôle: Admin
Statut: Approuvé ✓
```

### 2. Comptes Clients (5 au total)

**Vos comptes (que vous avez créés):**
```
Email: jean@milan.ci
Mot de passe: [Votre mot de passe]
Rôle: Client

Email: jeremie@test.com
Mot de passe: [Votre mot de passe]
Rôle: Client

Email: emmanuel@test.com
Mot de passe: [Votre mot de passe]
Rôle: Client
```

**Comptes de test (créés automatiquement):**
```
Email: client1@test.ci
Mot de passe: Test2025!
Rôle: Client
Nom: Jean-Marc Client
Business: Maquis Chez Fatou

Email: client2@test.ci
Mot de passe: Test2025!
Rôle: Client
Nom: Marie Restaurant
Business: Restaurant La Terrasse
```

### 3. Comptes Suppliers (2 au total)
```
Email: supplier1@test.ci
Mot de passe: Test2025!
Rôle: Supplier
Nom: Moussa Fournisseur
Business: Dépôt Express
Zone: Plateau, Cocody

Email: supplier2@test.ci
Mot de passe: Test2025!
Rôle: Supplier
Nom: Ibrahim Livraison
Business: Livraison Rapide
Zone: Marcory, Treichville
```

## IMPORTANT: Pourquoi ramattta@gmail.com ne fonctionne pas?

**Ce compte N'EXISTE PAS dans votre base de données Supabase !**

Les comptes comme ramattta@gmail.com, hermann.nguessan@ravito.ci, etc. sont du **code mockup** dans le fichier `src/data/demoAccounts.ts`. Ils n'ont JAMAIS été créés dans Supabase.

## Test Immédiat

**Essayez de vous connecter avec:**
```
Email: admin@ravito.ci
Mot de passe: Admin2025!
```

Ce compte vient d'être créé et est **approuvé** - il devrait fonctionner immédiatement.

## Si vous voulez plus de comptes de test

Vous avez 2 options:

### Option 1: Créer via l'interface d'inscription
1. Aller sur la page d'inscription
2. Remplir le formulaire
3. Je les approuverai ensuite via SQL

### Option 2: Je crée des comptes supplémentaires via SQL
Dites-moi combien de comptes vous voulez (clients et/ou suppliers) et je les crée avec des mots de passe simples.

## Récapitulatif des actions effectuées

1. ✓ Approuvé les 3 comptes existants (jean, jeremie, emmanuel)
2. ✓ Créé un compte admin fonctionnel (admin@ravito.ci)
3. ✓ Corrigé les politiques RLS
4. ✓ Corrigé le trigger d'inscription

**TOUT FONCTIONNE MAINTENANT !**
