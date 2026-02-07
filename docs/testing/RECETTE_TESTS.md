# 📋 RECETTE DE TESTS - RAVITO GESTION
## Mise En Production du 14 février 2026

---

## 📊 Vue d'ensemble

| Information | Détail |
|-------------|--------|
| **Module** | RAVITO Gestion |
| **Version** | 1.6.3 |
| **Date MEP** | 14 février 2026 |
| **Testeurs** | Équipe RAVITO |
| **Environnement** | Production |

---

## 🎯 PARCOURS 1 : INSCRIPTION ET AUTHENTIFICATION

### 1.1 Inscription nouveau compte
- [ ] **TC-001** : Affichage du formulaire d'inscription avec tous les champs requis
- [ ] **TC-002** : Validation email format correct (xxx@yyy.zzz)
- [ ] **TC-003** : Validation mot de passe (min 6 caractères)
- [ ] **TC-004** : Validation numéro téléphone (format ivoirien)
- [ ] **TC-005** : Message erreur si email déjà utilisé
- [ ] **TC-006** : Création compte réussie avec redirect vers dashboard
- [ ] **TC-007** : Email de confirmation envoyé après inscription
- [ ] **TC-008** : Profil utilisateur créé dans la base de données

### 1.2 Connexion
- [ ] **TC-009** : Affichage formulaire connexion (email + password)
- [ ] **TC-010** : Connexion réussie avec identifiants valides
- [ ] **TC-011** : Message erreur avec identifiants invalides
- [ ] **TC-012** : Lien "Mot de passe oublié" fonctionnel
- [ ] **TC-013** : Redirection vers dernière page visitée après connexion

### 1.3 Récupération mot de passe
- [ ] **TC-014** : Formulaire reset password accessible
- [ ] **TC-015** : Email de reset envoyé avec lien valide
- [ ] **TC-016** : Lien reset expire après 24h
- [ ] **TC-017** : Nouveau mot de passe enregistré correctement

---

## 🏪 PARCOURS 2 : GESTION ACTIVITÉ (Module Principal)

### 2.1 Cahier digital
- [ ] **TC-018** : Accès au cahier digital depuis menu principal
- [ ] **TC-019** : Affichage liste des entrées par ordre chronologique
- [ ] **TC-020** : Création nouvelle entrée (vente produit)
- [ ] **TC-021** : Calcul automatique du total
- [ ] **TC-022** : Modification entrée existante
- [ ] **TC-023** : Suppression entrée avec confirmation
- [ ] **TC-024** : Recherche entrée par date
- [ ] **TC-025** : Recherche entrée par produit
- [ ] **TC-026** : Export cahier en PDF
- [ ] **TC-027** : Export cahier en Excel

### 2.2 Gestion des stocks
- [ ] **TC-028** : Affichage liste stocks avec quantités actuelles
- [ ] **TC-029** : Ajout nouveau produit au stock
- [ ] **TC-030** : Modification quantité stock (entrée/sortie)
- [ ] **TC-031** : Alert stock bas (< seuil défini)
- [ ] **TC-032** : Historique mouvements stock
- [ ] **TC-033** : Calcul valeur totale stock
- [ ] **TC-034** : Export inventaire en PDF

### 2.3 Suivi des dépenses
- [ ] **TC-035** : Ajout nouvelle dépense avec catégorie
- [ ] **TC-036** : Liste dépenses par période
- [ ] **TC-037** : Filtrage par catégorie (Achats, Salaires, Loyer, etc.)
- [ ] **TC-038** : Calcul total dépenses période
- [ ] **TC-039** : Modification dépense existante
- [ ] **TC-040** : Suppression dépense avec confirmation
- [ ] **TC-041** : Export dépenses en PDF

### 2.4 Crédits clients
- [ ] **TC-042** : Liste clients avec soldes crédit
- [ ] **TC-043** : Ajout nouveau crédit client
- [ ] **TC-044** : Enregistrement paiement crédit (partiel/total)
- [ ] **TC-045** : Historique crédits par client
- [ ] **TC-046** : Alert crédits en retard (> 30 jours)
- [ ] **TC-047** : Calcul total crédits en cours
- [ ] **TC-048** : Export liste crédits en PDF

### 2.5 Rapports et statistiques
- [ ] **TC-049** : Dashboard avec KPIs principaux (CA, dépenses, bénéfice)
- [ ] **TC-050** : Graphique évolution CA sur 30 jours
- [ ] **TC-051** : Top 5 produits les plus vendus
- [ ] **TC-052** : Répartition dépenses par catégorie (pie chart)
- [ ] **TC-053** : Export rapport mensuel complet en PDF
- [ ] **TC-054** : Génération rapport personnalisé (date début/fin)

### 2.6 Sécurité des données
- [ ] **TC-055** : Données chiffrées en base de données
- [ ] **TC-056** : Backup automatique quotidien
- [ ] **TC-057** : Isolation données entre organisations (RLS)
- [ ] **TC-058** : Pas d'accès cross-organisation

---

## 💳 PARCOURS 3 : SYSTÈME D'ABONNEMENT

### 3.1 Période d'essai
- [ ] **TC-059** : Bannière "Essai gratuit" affichée au premier accès
- [ ] **TC-060** : Compteur jours restants visible (30 jours)
- [ ] **TC-061** : Accès complet module Gestion pendant essai
- [ ] **TC-062** : Notification à J-7 fin essai
- [ ] **TC-063** : Notification à J-2 fin essai
- [ ] **TC-064** : Blocage accès à J+1 après fin essai

### 3.2 Souscription abonnement
- [ ] **TC-065** : Affichage 3 plans (Mensuel 6000, Semestriel 30000, Annuel 48000)
- [ ] **TC-066** : Badge "Recommandé" sur plan Semestriel
- [ ] **TC-067** : Affichage détail économies (1 mois offert, 4 mois offerts)
- [ ] **TC-068** : Sélection plan et affichage récapitulatif
- [ ] **TC-069** : Calcul prorata automatique affiché
- [ ] **TC-070** : Confirmation souscription crée abonnement "pending_payment"
- [ ] **TC-071** : Facture générée automatiquement

### 3.3 Paiement
- [ ] **TC-072** : Affichage modes paiement (Espèces, Wave, Orange, MTN)
- [ ] **TC-073** : Instructions paiement claires
- [ ] **TC-074** : Validation paiement par Admin active abonnement
- [ ] **TC-075** : Email confirmation après activation
- [ ] **TC-076** : Accès module rétabli immédiatement

### 3.4 Renouvellement
- [ ] **TC-077** : Génération facture renouvellement automatique
- [ ] **TC-078** : Notification à J-30 (rappel renouvellement)
- [ ] **TC-079** : Notification à J-15
- [ ] **TC-080** : Notification à J-7
- [ ] **TC-081** : Notification à J-2
- [ ] **TC-082** : Suspension automatique si non payé à J+1

---

## 👥 PARCOURS 4 : PROFIL ET GESTION D'ÉQUIPE

### 4.1 Profil utilisateur
- [ ] **TC-083** : Affichage informations profil
- [ ] **TC-084** : Modification nom établissement
- [ ] **TC-085** : Modification email
- [ ] **TC-086** : Modification téléphone
- [ ] **TC-087** : Modification mot de passe
- [ ] **TC-088** : Upload photo profil (< 2MB)

### 4.2 Gestion équipe (si applicable)
- [ ] **TC-089** : Invitation nouveau membre équipe
- [ ] **TC-090** : Email invitation envoyé
- [ ] **TC-091** : Acceptation invitation par membre
- [ ] **TC-092** : Attribution rôle (Manager, Employé)
- [ ] **TC-093** : Restrictions accès selon rôle
- [ ] **TC-094** : Retrait membre équipe

---

## 💬 PARCOURS 5 : SUPPORT ET AIDE

### 5.1 Support client
- [ ] **TC-095** : Accès formulaire contact
- [ ] **TC-096** : Envoi message support
- [ ] **TC-097** : Email confirmation réception
- [ ] **TC-098** : Affichage FAQ avec questions fréquentes
- [ ] **TC-099** : Recherche dans FAQ fonctionnelle

---

## 👑 PARCOURS 6 : INTERFACE ADMIN

### 6.1 Gestion abonnements
- [ ] **TC-100** : Liste tous abonnements avec filtres
- [ ] **TC-101** : Statistiques abonnés (Total, Actifs, Suspendus)
- [ ] **TC-102** : Validation manuelle paiements
- [ ] **TC-103** : Suspension/Réactivation abonnement
- [ ] **TC-104** : Modification paramètres abonnement

### 6.2 Gestion factures
- [ ] **TC-105** : Liste toutes factures générées
- [ ] **TC-106** : Filtrage par statut (Payée, En attente)
- [ ] **TC-107** : Export factures en CSV
- [ ] **TC-108** : Statistiques revenus mensuels

---

## 📱 PARCOURS 7 : RESPONSIVE ET ERGONOMIE

### 7.1 Mobile (< 768px)
- [ ] **TC-109** : Navigation mobile fonctionnelle (menu hamburger)
- [ ] **TC-110** : Formulaires utilisables sur mobile
- [ ] **TC-111** : Tableaux scrollables horizontalement
- [ ] **TC-112** : Boutons actions accessibles

### 7.2 Tablette (768px - 1024px)
- [ ] **TC-113** : Layout adapté tablette
- [ ] **TC-114** : Graphiques lisibles
- [ ] **TC-115** : Navigation optimisée

### 7.3 Desktop (> 1024px)
- [ ] **TC-116** : Utilisation optimale espace écran
- [ ] **TC-117** : Sidebar navigation visible

---

## 🔌 PARCOURS 8 : MODE OFFLINE (PWA)

### 8.1 Progressive Web App
- [ ] **TC-118** : Installation PWA sur mobile
- [ ] **TC-119** : Consultation données en mode offline
- [ ] **TC-120** : Synchronisation auto au retour online
- [ ] **TC-121** : Notification sync réussie
- [ ] **TC-122** : Gestion conflits données offline/online

---

## 🐛 BUGS DÉTECTÉS

| ID | Sévérité | Description | Statut | Responsable |
|----|----------|-------------|--------|-------------|
| BUG-001 | 🔴 Critique | | ⏳ En cours | |
| BUG-002 | 🟠 Majeur | | ⏳ En cours | |
| BUG-003 | 🟡 Mineur | | ⏳ En cours | |

**Légende sévérité :**
- 🔴 **Critique** : Bloquant MEP - Aucun utilisateur ne peut utiliser la fonctionnalité
- 🟠 **Majeur** : Impact significatif - Certains utilisateurs affectés ou workaround complexe
- 🟡 **Mineur** : Impact faible - Problème cosmétique ou workaround simple

---

## ✅ VALIDATION FINALE

### Critères GO/NO GO

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| **Parcours critiques** : 100% tests Parcours 1-3 passent | ⬜ | |
| **Zéro bug critique** : Aucun bug 🔴 en cours | ⬜ | |
| **Performance** : Temps chargement < 3s | ⬜ | |
| **Sécurité** : RLS activé, données chiffrées | ⬜ | |
| **Build** : `npm run build` sans erreur | ⬜ | |
| **Tarification** : Prix corrects partout (6000/30000/48000) | ⬜ | |
| **Landing Page** : Countdown Marketplace fonctionnel | ⬜ | |
| **Documents légaux** : CGU/CGV à jour | ⬜ | |

### Résumé statistiques

```
Total tests : 122
Tests passés : ___ / 122 (___%)
Tests échoués : ___
Bugs critiques : ___
Bugs majeurs : ___
Bugs mineurs : ___
```

### Décision finale

- ⬜ **GO** : MEP autorisée le 14/02/2026
- ⬜ **NO GO** : MEP reportée - Raison : _______________________

---

## 📝 SIGNATURES

### Équipe Technique

| Nom | Rôle | Signature | Date |
|-----|------|-----------|------|
| | Développeur Lead | | |
| | QA Testeur | | |
| | DevOps | | |

### Équipe Management

| Nom | Rôle | Signature | Date |
|-----|------|-----------|------|
| | Product Owner | | |
| | Direction Technique | | |
| | Direction Générale | | |

---

## 📅 HISTORIQUE

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 07/02/2026 | Équipe RAVITO | Création document recette |

---

**Document généré pour la MEP RAVITO Gestion du 14 février 2026**
