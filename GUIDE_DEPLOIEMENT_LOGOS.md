# Guide de Déploiement - Mise à Jour Graphique RAVITO

## 🎯 Objectif

Ce guide vous accompagne dans le déploiement et la validation de la mise à jour graphique complète de l'application RAVITO.

---

## ✅ Modifications Déployées

Les modifications ont été **commitées et poussées** sur GitHub (branche `main`).

**Commit** : `a7b79de - feat: Mise à jour complète de l'identité graphique RAVITO`

---

## 🚀 Étapes de Déploiement

### 1. Vérification Locale (Développement)

```bash
# Cloner ou tirer les dernières modifications
cd DISTRI-NIGHT
git pull origin main

# Installer les dépendances (si nécessaire)
npm install

# Lancer le serveur de développement
npm run dev
```

**URL locale** : `http://localhost:5173`

### 2. Tests Visuels à Effectuer

#### A. Header (Navigation )

- [ ] **Landing Page** : Vérifier que le logo sans slogan s'affiche correctement en haut à gauche

- [ ] **Dashboard Client** : Vérifier le logo dans le header

- [ ] **Dashboard Fournisseur** : Vérifier le logo dans le header

- [ ] **Dashboard Admin** : Vérifier le logo dans le header

- [ ] **Sidebar Mobile** : Ouvrir le menu mobile et vérifier le logo

#### B. Footer

- [ ] **Landing Page** : Scroller jusqu'au footer et vérifier le logo avec slogan intégré

- [ ] Vérifier qu'il n'y a **pas de doublon** du texte du slogan

#### C. Landing Page - Section Hero

- [ ] Vérifier que le **grand logo avec slogan** s'affiche au centre

- [ ] Vérifier la taille et la qualité de l'image

#### D. Pages d'Authentification

- [ ] **Page de Connexion** (`/login`) :
  - Vérifier le logo avec slogan en haut
  - Vérifier que le titre "Connexion" est en dessous
  - Vérifier qu'il n'y a pas de texte de slogan séparé

- [ ] **Page d'Inscription** (`/register`) :
  - Vérifier le logo avec slogan en haut
  - Vérifier que le titre "Inscription" est en dessous

#### E. Écran de Chargement

- [ ] Rafraîchir la page et observer l'écran de chargement initial

- [ ] Vérifier que le logo avec slogan s'affiche (avec animation pulse)

### 3. Tests PWA (Progressive Web App)

#### A. Favicons (Navigateur)

- [ ] Vérifier l'icône dans l'onglet du navigateur

- [ ] Vérifier l'icône dans les favoris

#### B. Installation PWA sur Mobile

**Sur iOS (Safari)** :

1. Ouvrir l'application dans Safari

1. Appuyer sur le bouton "Partager" (icône carré avec flèche)

1. Sélectionner "Sur l'écran d'accueil"

1. Vérifier que la **nouvelle icône** s'affiche

1. Lancer l'application depuis l'écran d'accueil

1. Vérifier le **splash screen** au démarrage (logo avec slogan sur fond blanc)

**Sur Android (Chrome)** :

1. Ouvrir l'application dans Chrome

1. Appuyer sur le menu (3 points)

1. Sélectionner "Installer l'application"

1. Vérifier que la **nouvelle icône** s'affiche sur l'écran d'accueil

1. Lancer l'application

1. Vérifier le **splash screen** au démarrage

#### C. Mode Hors Ligne

- [ ] Installer la PWA

- [ ] Activer le mode avion

- [ ] Ouvrir l'application

- [ ] Vérifier que les logos s'affichent correctement (cache du Service Worker)

### 4. Tests Multi-Navigateurs

- [ ] **Chrome** : Tester sur desktop et mobile

- [ ] **Firefox** : Tester sur desktop

- [ ] **Safari** : Tester sur macOS et iOS

- [ ] **Edge** : Tester sur desktop

### 5. Tests Responsive

- [ ] **Mobile** (320px - 480px) : Vérifier la taille des logos

- [ ] **Tablette** (768px - 1024px) : Vérifier la taille des logos

- [ ] **Desktop** (1280px+) : Vérifier la taille des logos

---

## 🔧 Déploiement en Production

### Option 1 : Déploiement Automatique (CI/CD)

Si vous avez configuré un pipeline CI/CD (Vercel, Netlify, etc.), le déploiement se fera automatiquement après le push sur `main`.

**Actions à effectuer** :

1. Vérifier que le déploiement s'est bien déclenché

1. Attendre la fin du build

1. Vider le cache du CDN (si applicable)

1. Tester l'application en production

### Option 2 : Déploiement Manuel

```bash
# Build de production
npm run build

# Le dossier dist/ contient les fichiers à déployer
# Déployer le contenu de dist/ sur votre serveur
```

### Post-Déploiement

1. **Vider le cache du Service Worker** :

   ```javascript
   const CACHE_NAME = 'ravito-v2'; // Incrémenter la version
   ```
  - Modifier `CACHE_NAME` dans `public/sw.js` :
  - Commit et redéployer

1. **Forcer le rechargement pour les utilisateurs** :
  - Les utilisateurs devront rafraîchir la page (Ctrl+F5 ou Cmd+Shift+R)
  - Le Service Worker se mettra à jour automatiquement

1. **Vérifier les métriques** :
  - Temps de chargement des nouvelles images
  - Taille des fichiers téléchargés
  - Taux d'installation PWA

---

## 📊 Checklist de Validation Finale

### Visuel

- [ ] Tous les anciens logos ont disparu

- [ ] Les nouveaux logos s'affichent correctement partout

- [ ] Pas de doublon du slogan en texte

- [ ] Les logos sont nets et de bonne qualité

- [ ] Les couleurs sont cohérentes (orange #E85D24)

### Technique

- [ ] Aucune erreur dans la console du navigateur

- [ ] Les favicons se chargent correctement (vérifier dans l'onglet Network)

- [ ] Le manifest PWA est valide (vérifier dans DevTools > Application > Manifest)

- [ ] Le Service Worker fonctionne (vérifier dans DevTools > Application > Service Workers)

- [ ] Les splash screens iOS s'affichent au démarrage

### Performance

- [ ] Les images se chargent rapidement

- [ ] Pas de décalage de mise en page (CLS)

- [ ] Les logos sont mis en cache correctement

### Accessibilité

- [ ] Tous les logos ont un attribut `alt` descriptif

- [ ] Les logos sont visibles en mode sombre (si applicable)

- [ ] Les logos sont lisibles à différentes tailles

---

## 🐛 Dépannage

### Problème : Les anciens logos s'affichent encore

**Solution** :

1. Vider le cache du navigateur (Ctrl+Shift+Delete)

1. Désinstaller et réinstaller la PWA

1. Vérifier que le Service Worker est à jour :
  - DevTools > Application > Service Workers
  - Cliquer sur "Update" ou "Unregister"

### Problème : Les favicons ne se mettent pas à jour

**Solution** :

1. Fermer tous les onglets de l'application

1. Vider le cache du navigateur

1. Rouvrir l'application dans un nouvel onglet

1. Si le problème persiste, vérifier que les fichiers favicon sont bien déployés

### Problème : Le splash screen iOS ne s'affiche pas

**Solution** :

1. Désinstaller l'application de l'écran d'accueil

1. Vider le cache de Safari (Réglages > Safari > Effacer historique et données)

1. Réinstaller l'application

1. Vérifier que les fichiers `splash-*.png` sont bien déployés

### Problème : Les logos sont flous ou pixelisés

**Solution** :

1. Vérifier que les fichiers PNG haute résolution sont utilisés

1. Vérifier les classes CSS `className` pour la taille des logos

1. Utiliser des versions SVG si possible (pour le logo sans slogan)

---

## 📝 Notes Importantes

### Tailles des Logos

- **Header** : `h-8 sm:h-10` (32px à 40px de hauteur)

- **Landing Hero** : `h-48 md:h-56` (192px à 224px de hauteur)

- **Footer** : `h-20` (80px de hauteur)

- **Connexion/Inscription** : `h-28` à `h-32` (112px à 128px de hauteur)

### Fichiers à Ne Pas Modifier

- `logo_sans_slogan.png` : Logo pour header (150 KB)

- `Logo_Ravito_avec_slogan.png` : Logo avec slogan (327 KB)

- Tous les fichiers favicon et splash screens

### Optimisations Futures (Optionnel)

1. **Conversion en WebP** :

   ```bash
   # Réduire la taille des fichiers PNG
   cwebp Logo_Ravito_avec_slogan.png -o Logo_Ravito_avec_slogan.webp
   ```

1. **Création de versions SVG** :
  - Convertir `logo_sans_slogan.png` en SVG pour une meilleure qualité
  - Utiliser un outil comme Inkscape ou Adobe Illustrator

1. **Lazy Loading** :
  - Ajouter `loading="lazy"` aux images non critiques

---

## 🎉 Conclusion

La mise à jour graphique est maintenant déployée et prête à être testée. Suivez ce guide étape par étape pour valider que tout fonctionne correctement.

**En cas de problème** : Consultez la section Dépannage ou contactez l'équipe de développement.

---

**Document créé le** : 18 décembre 2025**Version** : 1.0**Projet** : DISTRI-NIGHT / RAVITO

