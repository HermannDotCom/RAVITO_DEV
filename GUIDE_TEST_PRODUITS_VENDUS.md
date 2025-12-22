# Guide de Test - Refonte "Produits vendus"

## Vue d'ensemble
Ce guide permet de tester la nouvelle interface "Produits vendus" pour les fournisseurs.

## Prérequis
1. Compte fournisseur actif dans RAVITO
2. Au moins quelques produits dans le catalogue
3. Navigateur moderne (Chrome, Firefox, Safari, Edge)

## Tests Fonctionnels

### 1. Navigation et Affichage

#### Test 1.1 : Vérifier le renommage
- [ ] Se connecter en tant que fournisseur
- [ ] Vérifier que le menu latéral affiche "Produits vendus" au lieu de "Mes Prix"
- [ ] Cliquer sur "Produits vendus"
- [ ] Vérifier que le titre de la page est "Produits vendus"
- [ ] Vérifier le sous-titre : "Gestion quotidienne de vos stocks et de vos prix"

#### Test 1.2 : Vérifier les KPIs
- [ ] Vérifier l'affichage de 4 cartes de statistiques :
  - Produits Catalogue (avec nombre de produits avec prix)
  - Stock Initial (unités déclarées)
  - Qté Vendue (depuis dernière réinit.)
  - Écart Moyen (vs prix référence)

### 2. Tableau des Produits

#### Test 2.1 : Affichage du tableau
- [ ] Vérifier que le tableau affiche TOUS les produits du catalogue
- [ ] Vérifier les colonnes :
  - Produit (nom + marque/format)
  - Prix [Nom du fournisseur] (dynamique)
  - Référence (prix RAVITO)
  - Écart % (avec code couleur)
  - Stock Initial
  - Qté Vendue
  - Stock Final
  - Actions

#### Test 2.2 : Recherche de produits
- [ ] Saisir un terme de recherche dans la barre
- [ ] Vérifier que les produits sont filtrés correctement
- [ ] Effacer la recherche et vérifier que tous les produits réapparaissent

#### Test 2.3 : Édition des prix et stocks
- [ ] Cliquer sur l'icône "Modifier" d'un produit
- [ ] Modifier le prix fournisseur
- [ ] Modifier le stock initial
- [ ] Cliquer sur "Enregistrer"
- [ ] Vérifier que les modifications sont sauvegardées
- [ ] Vérifier que l'écart % est recalculé
- [ ] Vérifier qu'un message de succès s'affiche

#### Test 2.4 : Calculs automatiques
- [ ] Modifier le prix d'un produit qui a un prix de référence
- [ ] Vérifier que l'écart % se met à jour automatiquement
- [ ] Vérifier le code couleur (vert si négatif/compétitif, rouge si élevé)
- [ ] Vérifier que Stock Final = Stock Initial - Qté Vendue

### 3. Réinitialisation des Quantités

#### Test 3.1 : Modal de confirmation
- [ ] Cliquer sur "Réinitialiser les quantités vendues"
- [ ] Vérifier que la modal s'affiche avec le bon message
- [ ] Vérifier les avertissements (action irréversible, etc.)
- [ ] Cliquer sur "Annuler" et vérifier que rien ne change

#### Test 3.2 : Réinitialisation effective
- [ ] Cliquer à nouveau sur "Réinitialiser les quantités vendues"
- [ ] Cliquer sur "Confirmer la réinitialisation"
- [ ] Vérifier qu'un message de succès s'affiche
- [ ] Vérifier que toutes les "Qté Vendue" passent à 0
- [ ] Vérifier que les "Stock Final" sont recalculés

### 4. Export d'Inventaire (XLSX)

#### Test 4.1 : Export d'inventaire
- [ ] Cliquer sur "Import/Export"
- [ ] Cliquer sur "Exporter l'inventaire (XLSX)"
- [ ] Vérifier qu'un fichier Excel est téléchargé
- [ ] Vérifier le nom du fichier : `Inventaire_[Nom]_[Date].xlsx`
- [ ] Ouvrir le fichier et vérifier :
  - Feuille "Inventaire" avec en-tête personnalisé
  - Toutes les colonnes présentes
  - Données correctes
  - Synthèse financière en bas
  - Feuille "Mouvements" avec taux de rotation

#### Test 4.2 : Mise en forme du fichier
- [ ] Vérifier que les prix sont formatés en FCFA
- [ ] Vérifier que les colonnes ont une largeur appropriée
- [ ] Vérifier les en-têtes en gras

### 5. Template d'Import (XLSX)

#### Test 5.1 : Téléchargement du template
- [ ] Dans la modal Import/Export, cliquer sur "Télécharger le Template (XLSX)"
- [ ] Vérifier qu'un fichier est téléchargé : `Template_Prix_Import_[Date].xlsx`
- [ ] Ouvrir le fichier et vérifier :
  - Feuille "Saisie" avec colonnes : Référence*, Produit, Prix [Nom]*, Stock Initial
  - Ligne d'exemple présente
  - Feuille "Instructions" avec guide complet
  - Feuille "Références" avec liste complète des produits

### 6. Import de Prix (XLSX)

#### Test 6.1 : Import avec fichier valide
- [ ] Remplir le template avec quelques prix
- [ ] Cliquer sur "Importer les prix (XLSX)"
- [ ] Sélectionner le fichier rempli
- [ ] Vérifier qu'un message de succès s'affiche avec le nombre d'imports
- [ ] Vérifier que les prix sont mis à jour dans le tableau

#### Test 6.2 : Import avec erreurs
- [ ] Créer un fichier avec des références incorrectes
- [ ] L'importer
- [ ] Vérifier que les erreurs sont listées avec détails
- [ ] Vérifier que les lignes valides sont quand même importées

#### Test 6.3 : Validation des données
- [ ] Essayer d'importer un fichier CSV → doit être rejeté
- [ ] Essayer d'importer avec prix négatif → doit signaler l'erreur
- [ ] Essayer d'importer avec référence vide → doit signaler l'erreur

### 7. Responsivité Mobile

#### Test 7.1 : Affichage mobile
- [ ] Ouvrir la page sur mobile (ou mode responsive)
- [ ] Vérifier que le tableau est scrollable horizontalement
- [ ] Vérifier que les boutons sont accessibles
- [ ] Vérifier que la modal s'affiche correctement

### 8. Workflow Quotidien

#### Test 8.1 : Cycle complet
- [ ] **Ouverture** :
  - Saisir les stocks initiaux pour quelques produits
  - Réinitialiser les quantités vendues
- [ ] **Simulation d'activité** :
  - Créer une commande en tant que client (autre compte)
  - La valider et marquer comme livrée
  - Revenir sur "Produits vendus"
  - Vérifier que les "Qté Vendue" ont augmenté
  - Vérifier que les "Stock Final" ont diminué
- [ ] **Clôture** :
  - Vérifier l'inventaire
  - Exporter l'inventaire pour archivage

### 9. Tests de Performance

#### Test 9.1 : Chargement avec beaucoup de produits
- [ ] Vérifier que le tableau charge rapidement même avec 100+ produits
- [ ] Vérifier que la recherche reste réactive
- [ ] Vérifier que l'édition ne cause pas de lag

## Tests de Sécurité

### Test 10.1 : Isolation des données
- [ ] Se connecter avec Fournisseur A
- [ ] Noter quelques prix saisis
- [ ] Se déconnecter et se connecter avec Fournisseur B
- [ ] Vérifier que les prix du Fournisseur A ne sont pas visibles/modifiables

### Test 10.2 : Validation des permissions
- [ ] Essayer d'accéder à la page avec un compte Client
- [ ] Vérifier que l'accès est refusé ou que la page n'est pas dans le menu

## Bugs Connus / Limitations

- Le trigger de mise à jour des quantités vendues ne fonctionne que si la commande a un supplier_id
- L'export peut être lent avec beaucoup de produits (100+)
- Pas de système de toast notifications (messages inline à la place)

## Critères de Succès

✅ Tous les tests fonctionnels passent
✅ Aucune erreur JavaScript dans la console
✅ Les données sont correctement sauvegardées et chargées
✅ Les fichiers Excel sont bien formatés et lisibles
✅ L'interface est responsive sur mobile
✅ Les permissions sont correctement appliquées

## Rapporter un Bug

Si vous trouvez un bug, notez :
1. Étapes pour reproduire
2. Comportement attendu
3. Comportement observé
4. Capture d'écran si pertinent
5. Navigateur et système d'exploitation
