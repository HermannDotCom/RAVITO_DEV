# 🔐 COMPTES DE TEST DISTRI-NIGHT

## Instructions de Création

Les comptes de test doivent être créés via l'interface d'inscription de l'application car Supabase Auth nécessite des opérations spécifiques que seul le frontend peut effectuer correctement.

---

## 📋 LISTE DES COMPTES À CRÉER

### 1️⃣ ADMINISTRATEUR

**Compte Admin Principal**
```
Email:     admin@distri-night.ci
Password:  Admin@2025!
Nom:       Kouassi Administrateur
Téléphone: +225 07 00 00 00 01
Adresse:   Siège DISTRI-NIGHT, Plateau, Abidjan
Rôle:      Admin
```

**Accès :** Gestion complète de la plateforme
- Approbation des utilisateurs
- Gestion des produits
- Gestion des commandes
- Gestion des zones de livraison
- Analytics et statistiques
- Trésorerie
- Paramètres système

---

### 2️⃣ CLIENTS (Gérants de bars/maquis)

#### Client 1 - Maquis Chez Fatou
```
Email:            client1@test.ci
Password:         Client@2025!
Nom:              Jean-Marc Yao
Téléphone:        +225 07 11 22 33 44
Adresse:          Maquis Chez Fatou, Cocody Riviera
Nom commercial:   Maquis Chez Fatou
Horaires:         18:00 - 06:00
Responsable:      Jean-Marc Yao
Rôle:             Client
```

**Accès :**
- Catalogue de produits
- Panier & commandes
- Suivi de livraison
- Historique des commandes
- Évaluation des fournisseurs

#### Client 2 - Le Griot d'Or
```
Email:            client2@test.ci
Password:         Client@2025!
Nom:              Adjoua Marie
Téléphone:        +225 07 22 33 44 55
Adresse:          Bar Le Griot d'Or, Marcory Zone 4
Nom commercial:   Le Griot d'Or
Horaires:         17:00 - 03:00
Responsable:      Adjoua Marie
Rôle:             Client
```

**Accès :** Identique au Client 1

#### Client 3 - Restaurant La Terrasse
```
Email:            client3@test.ci
Password:         Client@2025!
Nom:              Koffi Patrick
Téléphone:        +225 07 33 44 55 66
Adresse:          Restaurant La Terrasse, Plateau
Nom commercial:   Restaurant La Terrasse
Horaires:         19:00 - 02:00
Responsable:      Koffi Patrick
Rôle:             Client
```

**Accès :** Identique au Client 1

---

### 3️⃣ FOURNISSEURS (Dépôts de boissons)

#### Fournisseur 1 - Dépôt Traoré & Fils
```
Email:            supplier1@test.ci
Password:         Supplier@2025!
Nom:              Moussa Traoré
Téléphone:        +225 07 44 55 66 77
Adresse:          Dépôt du Plateau, Avenue Franchet d'Esperey
Nom commercial:   Dépôt Traoré & Fils
Horaires:         18:00 - 08:00
Zone de couverture: Plateau, Marcory, Treichville
Capacité livraison: Camion (Truck)
Rôle:             Supplier
```

**Accès :**
- Commandes disponibles
- Acceptation/refus de commandes
- Livraisons actives
- Historique des livraisons
- Évaluation des clients

#### Fournisseur 2 - Dépôt Express Cocody
```
Email:            supplier2@test.ci
Password:         Supplier@2025!
Nom:              Ibrahim Koné
Téléphone:        +225 07 55 66 77 88
Adresse:          Dépôt Cocody, Riviera Palmeraie
Nom commercial:   Dépôt Express Cocody
Horaires:         17:00 - 07:00
Zone de couverture: Cocody, Angré, Riviera
Capacité livraison: Tricycle
Rôle:             Supplier
```

**Accès :** Identique au Fournisseur 1

#### Fournisseur 3 - Dépôt Rapid'Yop
```
Email:            supplier3@test.ci
Password:         Supplier@2025!
Nom:              Sékou Diaby
Téléphone:        +225 07 66 77 88 99
Adresse:          Dépôt Yopougon, Sideci
Nom commercial:   Dépôt Rapid'Yop
Horaires:         18:00 - 06:00
Zone de couverture: Yopougon, Abobo, Adjamé
Capacité livraison: Moto (Motorcycle)
Rôle:             Supplier
```

**Accès :** Identique au Fournisseur 1

---

## 🚀 MÉTHODE DE CRÉATION

### Option 1 : Via l'Interface Web (RECOMMANDÉ)

1. **Ouvrir l'application** en mode dev : `npm run dev`
2. **Accéder à la page d'inscription**
3. **Créer chaque compte** avec les informations ci-dessus
4. **Pour l'admin** : Après création, mettre à jour le rôle en base :
   ```sql
   UPDATE profiles
   SET role = 'admin',
       is_approved = true,
       approval_status = 'approved'
   WHERE email = 'admin@distri-night.ci';
   ```

### Option 2 : Via Supabase Auth Dashboard

1. **Aller dans le dashboard Supabase** : https://0ec90b57d6e95fcbda19832f.supabase.co
2. **Section Authentication > Users**
3. **Cliquer "Add User"**
4. Créer chaque utilisateur avec :
   - Email
   - Password
   - Auto Confirm Email: ✅ Coché
5. **Ensuite créer le profil dans la table `profiles`** :
   ```sql
   INSERT INTO profiles (
     id,
     role,
     name,
     phone,
     address,
     business_name,
     business_hours,
     responsible_person,
     coverage_zone,
     delivery_capacity,
     is_active,
     is_approved,
     approval_status
   ) VALUES (
     '[user_id_from_auth]',
     'client', -- ou 'supplier', 'admin'
     'Nom Complet',
     '+225 07 XX XX XX XX',
     'Adresse',
     'Nom Commercial',
     '18:00 - 06:00',
     'Responsable',
     'Zone', -- pour suppliers uniquement
     'truck', -- pour suppliers uniquement
     true,
     true,
     'approved'
   );
   ```

---

## 📊 RÉCAPITULATIF RAPIDE

| Type | Email | Mot de passe | Nom | Rôle |
|------|-------|--------------|-----|------|
| **Admin** | admin@distri-night.ci | Admin@2025! | Kouassi Administrateur | admin |
| **Client** | client1@test.ci | Client@2025! | Jean-Marc Yao | client |
| **Client** | client2@test.ci | Client@2025! | Adjoua Marie | client |
| **Client** | client3@test.ci | Client@2025! | Koffi Patrick | client |
| **Supplier** | supplier1@test.ci | Supplier@2025! | Moussa Traoré | supplier |
| **Supplier** | supplier2@test.ci | Supplier@2025! | Ibrahim Koné | supplier |
| **Supplier** | supplier3@test.ci | Supplier@2025! | Sékou Diaby | supplier |

---

## 🧪 SCÉNARIOS DE TEST

### Scénario 1 : Flux complet de commande

1. **Se connecter comme Client** (client1@test.ci)
2. Parcourir le catalogue
3. Ajouter des produits au panier
4. Passer une commande
5. **Se déconnecter et se connecter comme Supplier** (supplier1@test.ci)
6. Voir la nouvelle commande disponible
7. Accepter la commande
8. Marquer comme en préparation
9. Marquer comme en livraison
10. **Se reconnecter comme Client**
11. Suivre la livraison
12. Confirmer la réception
13. Évaluer le fournisseur

### Scénario 2 : Gestion Admin

1. **Se connecter comme Admin** (admin@distri-night.ci)
2. Voir les analytics
3. Gérer les utilisateurs (approbation, désactivation)
4. Gérer les produits (ajout, modification)
5. Voir les commandes en cours
6. Consulter la trésorerie
7. Gérer les zones de livraison
8. Modifier les paramètres système

### Scénario 3 : Multi-utilisateurs

1. Créer plusieurs commandes avec différents clients
2. Les accepter avec différents fournisseurs
3. Vérifier les notifications
4. Tester le mode sombre
5. Tester les filtres de recherche
6. Exporter des données (admin)

---

## ⚠️ NOTES IMPORTANTES

1. **Tous les comptes sont pré-approuvés** (is_approved = true)
   - Normalement les nouveaux comptes doivent être approuvés par l'admin
   - Pour les tests, ils sont déjà approuvés

2. **Mots de passe forts**
   - Tous suivent le format: `Role@2025!`
   - Changez-les en production !

3. **Données réalistes**
   - Noms ivoiriens
   - Adresses d'Abidjan
   - Numéros de téléphone format CI (+225)

4. **Zones géographiques cohérentes**
   - Chaque fournisseur couvre des zones spécifiques
   - Plateau, Cocody, Yopougon, etc.

5. **Capacités de livraison variées**
   - Camion : Grande capacité (grosses commandes)
   - Tricycle : Capacité moyenne
   - Moto : Petites livraisons rapides

---

## 🔒 SÉCURITÉ

**⚠️ ATTENTION : Ces comptes sont pour TEST uniquement !**

- ❌ Ne PAS utiliser en production
- ❌ Ne PAS partager publiquement
- ❌ Ne PAS utiliser de vraies données personnelles
- ✅ Supprimer après les tests
- ✅ Créer de nouveaux comptes pour la production
- ✅ Utiliser des mots de passe forts et uniques

---

## 📞 SUPPORT

Si vous rencontrez des problèmes lors de la création des comptes :

1. Vérifier que l'application est bien lancée (`npm run dev`)
2. Vérifier les variables d'environnement dans `.env`
3. Consulter la console du navigateur pour les erreurs
4. Vérifier les logs Supabase dans le dashboard

---

**Date de création :** 2025-10-04
**Version :** 1.0.0
**Status :** ✅ Prêt pour tests

---

## 🎯 QUICK START

**Pour tester rapidement :**

1. Lancer l'app : `npm run dev`
2. S'inscrire avec un compte client : `client1@test.ci` / `Client@2025!`
3. Explorer le catalogue et passer une commande
4. Se déconnecter et se connecter en tant que fournisseur : `supplier1@test.ci` / `Supplier@2025!`
5. Accepter et traiter la commande
6. Se connecter en tant qu'admin : `admin@distri-night.ci` / `Admin@2025!`
7. Explorer les analytics et fonctionnalités admin

**Bon test ! 🚀**
