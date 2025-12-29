# 🔑 ACCÈS RAPIDES - COMPTES DE TEST

## 📱 CONNEXION RAPIDE

### 👨‍💼 ADMINISTRATEUR
```
🌐 URL:      http://localhost:5173
📧 Email:    admin@ravito.ci
🔒 Password: Admin@2025!
👤 Nom:      Kouassi Administrateur
```

### 👤 CLIENTS (3 comptes disponibles)

#### Client #1 - Maquis Chez Fatou
```
📧 Email:    client1@test.ci
🔒 Password: Client@2025!
👤 Nom:      Jean-Marc Yao
🏪 Établissement: Maquis Chez Fatou, Cocody
📞 Tel:      +225 07 11 22 33 44
```

#### Client #2 - Le Griot d'Or
```
📧 Email:    client2@test.ci
🔒 Password: Client@2025!
👤 Nom:      Adjoua Marie
🏪 Établissement: Le Griot d'Or, Marcory
📞 Tel:      +225 07 22 33 44 55
```

#### Client #3 - Restaurant La Terrasse
```
📧 Email:    client3@test.ci
🔒 Password: Client@2025!
👤 Nom:      Koffi Patrick
🏪 Établissement: Restaurant La Terrasse, Plateau
📞 Tel:      +225 07 33 44 55 66
```

### 🚚 FOURNISSEURS (3 comptes disponibles)

#### Supplier #1 - Dépôt Traoré & Fils
```
📧 Email:    supplier1@test.ci
🔒 Password: Supplier@2025!
👤 Nom:      Moussa Traoré
🏪 Dépôt:    Dépôt Traoré & Fils, Plateau
🚛 Véhicule: Camion (Truck)
📍 Zone:     Plateau, Marcory, Treichville
📞 Tel:      +225 07 44 55 66 77
```

#### Supplier #2 - Dépôt Express Cocody
```
📧 Email:    supplier2@test.ci
🔒 Password: Supplier@2025!
👤 Nom:      Ibrahim Koné
🏪 Dépôt:    Dépôt Express Cocody
🛺 Véhicule: Tricycle
📍 Zone:     Cocody, Angré, Riviera
📞 Tel:      +225 07 55 66 77 88
```

#### Supplier #3 - Dépôt Rapid'Yop
```
📧 Email:    supplier3@test.ci
🔒 Password: Supplier@2025!
👤 Nom:      Sékou Diaby
🏪 Dépôt:    Dépôt Rapid'Yop, Yopougon
🏍️ Véhicule: Moto (Motorcycle)
📍 Zone:     Yopougon, Abobo, Adjamé
📞 Tel:      +225 07 66 77 88 99
```

---

## 🎬 SCÉNARIO DE TEST RAPIDE (5 minutes)

### Étape 1 : Test Client (2 min)
1. Se connecter : `client1@test.ci` / `Client@2025!`
2. Aller dans "Catalogue"
3. Ajouter 3 produits au panier
4. Aller dans "Panier" et valider
5. Remplir l'adresse de livraison
6. Choisir "Orange Money" comme paiement
7. Confirmer la commande
8. Se déconnecter

### Étape 2 : Test Supplier (2 min)
1. Se connecter : `supplier1@test.ci` / `Supplier@2025!`
2. Voir la nouvelle commande dans "Commandes disponibles"
3. Cliquer "Accepter la commande"
4. Entrer temps de livraison estimé : 45 min
5. Aller dans "Livraisons actives"
6. Marquer comme "En préparation"
7. Puis "En livraison"
8. Puis "Livrée"
9. Se déconnecter

### Étape 3 : Test Admin (1 min)
1. Se connecter : `admin@ravito.ci` / `Admin@2025!`
2. Voir le dashboard Analytics
3. Vérifier les statistiques de commandes
4. Aller dans "Utilisateurs" voir les 7 comptes
5. Aller dans "Commandes" voir l'historique
6. Tester l'export CSV des données

---

## 💡 FONCTIONNALITÉS À TESTER

### Pour TOUS les rôles :
- ✅ Connexion / Déconnexion
- ✅ Profil utilisateur
- ✅ Mode sombre (toggle en haut à droite)
- ✅ Recherche (barre en haut)
- ✅ Navigation (menu latéral)

### Pour CLIENTS :
- ✅ Catalogue de produits
- ✅ Filtres avancés (catégorie, prix, alcool)
- ✅ Recherche de produits
- ✅ Panier (ajouter/supprimer/quantité)
- ✅ Checkout et commande
- ✅ Suivi de livraison en temps réel
- ✅ Historique des commandes
- ✅ Évaluation des fournisseurs
- ✅ Breadcrumbs navigation

### Pour FOURNISSEURS :
- ✅ Commandes disponibles
- ✅ Acceptation de commandes
- ✅ Gestion des livraisons actives
- ✅ Historique des livraisons
- ✅ Évaluation des clients
- ✅ Statistiques personnelles

### Pour ADMIN :
- ✅ Dashboard Analytics
- ✅ Gestion utilisateurs (approbation/rejet)
- ✅ Gestion produits (CRUD)
- ✅ Gestion commandes (vue globale)
- ✅ Gestion zones de livraison
- ✅ Trésorerie et commissions
- ✅ Paramètres système
- ✅ Export de données (CSV, Excel, JSON)

---

## 🔧 COMMANDES UTILES

```bash
# Lancer l'application
npm run dev

# Lancer les tests
npm test

# Build production
npm run build

# Voir l'interface de tests
npm run test:ui
```

---

## 📞 URLS IMPORTANTES

- **Application locale :** http://localhost:5173
- **Supabase Dashboard :** https://0ec90b57d6e95fcbda19832f.supabase.co
- **Documentation :** Voir fichiers .md dans le projet

---

## ⚠️ IMPORTANT

**Ces comptes doivent être créés manuellement via :**

1. **L'interface d'inscription de l'app** (méthode recommandée)
   - Ouvrir http://localhost:5173
   - S'inscrire avec les infos ci-dessus
   - L'admin devra approuver les comptes (ou modifier is_approved en base)

2. **Ou via Supabase Dashboard**
   - Authentication > Users > Add User
   - Puis créer le profil dans la table `profiles`

**Note :** L'admin doit être créé en premier, puis les autres utilisateurs.

---

## 🎯 PATTERN DES MOTS DE PASSE

Tous les mots de passe suivent le même pattern pour faciliter les tests :
- Admin : `Admin@2025!`
- Client : `Client@2025!`
- Supplier : `Supplier@2025!`

**⚠️ À CHANGER EN PRODUCTION !**

---

## 📊 DONNÉES DE TEST

Le système contient déjà :
- ✅ 26 produits (bières, sodas, vins, etc.)
- ✅ 10 zones de livraison (communes d'Abidjan)
- ✅ Paramètres de commission configurables via Admin
- ✅ Catégories de produits
- ✅ Types de caisses (C24, C12, C12V, C6)

Vous n'avez qu'à créer les 7 comptes utilisateurs !

---

**Status :** 🟢 Prêt pour tests
**Dernière mise à jour :** 2025-12-29

**Bon test ! 🚀**
