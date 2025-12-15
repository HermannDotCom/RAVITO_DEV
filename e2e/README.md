# 🧪 E2E Tests - RAVITO

Suite complète de tests End-to-End avec Playwright pour le MVP RAVITO avant le lancement beta en Côte d'Ivoire.

## 📁 Structure

```
e2e/
├── fixtures/
│   ├── test-data.ts      # Données de test centralisées
│   └── page-objects.ts   # Page Objects réutilisables
├── landing/
│   └── landing.spec.ts   # Tests Landing Page (6 tests)
├── auth/
│   └── auth.spec.ts      # Tests Authentification (3 tests)
├── pwa/
│   └── pwa.spec.ts       # Tests PWA (4 tests)
└── legal/
    └── legal.spec.ts     # Tests Pages Légales (4 tests)
```

## 🚀 Exécution des Tests

### Commandes disponibles

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter avec l'interface UI
npm run test:e2e:ui

# Exécuter en mode visible (headed)
npm run test:e2e:headed

# Exécuter en mode debug
npm run test:e2e:debug

# Afficher le rapport HTML
npm run test:e2e:report
```

### Exécution sur navigateurs spécifiques

```bash
# Chrome uniquement
npx playwright test --project=chromium

# Firefox uniquement
npx playwright test --project=firefox

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

## ⚙️ Configuration Environnement

### Variables d'environnement requises

Créer un fichier `.env` à la racine avec :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** Ces variables sont automatiquement injectées en CI via GitHub Secrets.

## 📊 Couverture des Tests

### Landing Page (6 tests)
- ✅ Affichage section héro avec slogan
- ✅ Affichage propositions de valeur
- ✅ Navigation vers formulaire de connexion
- ✅ Navigation vers page CGU
- ✅ Navigation vers Mentions Légales
- ✅ Responsive design mobile

### Authentification (3 tests)
- ✅ Affichage formulaire de connexion
- ✅ Erreur pour identifiants invalides
- ✅ Basculement vers inscription

### PWA (4 tests)
- ✅ Manifest.json valide
- ✅ Service Worker registration
- ✅ Page offline disponible
- ✅ Meta tags PWA présents

### Pages Légales (4 tests)
- ✅ Affichage CGU avec articles
- ✅ Affichage tarification dans CGU
- ✅ Affichage Mentions Légales
- ✅ Navigation retour vers landing

## 🛠️ Page Objects

### LandingPage
```typescript
const landing = new LandingPage(page);
await landing.goto();
await landing.clickSeConnecter();
await landing.goToCGU();
```

### AuthPage
```typescript
const auth = new AuthPage(page);
await auth.waitForLoginForm();
await auth.login(email, password);
await auth.expectError();
```

## 🔍 Debugging

### Afficher les traces
```bash
npx playwright show-trace test-results/.../trace.zip
```

### Consulter les screenshots
Les screenshots des échecs sont dans `test-results/`

### Mode debug interactif
```bash
npm run test:e2e:debug
```

## 🌐 Configuration Multi-navigateurs

Tests configurés pour :
- **Desktop Chrome** (Chromium)
- **Desktop Firefox**
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 13)

Locale configurée : `fr-FR`

## 📝 Bonnes Pratiques

1. **Sélecteurs robustes** : Utiliser `getByRole()` en priorité
2. **Timeouts adaptés** : 15s pour actions, 30s pour navigation
3. **Retry automatique** : 2 retries en CI
4. **Screenshots/vidéos** : Capturés automatiquement en cas d'échec
5. **Traces** : Activées au premier retry

## 🚨 Troubleshooting

### Tests qui échouent localement

1. Vérifier que `.env` existe avec les bonnes variables
2. Vérifier que le dev server démarre : `npm run dev`
3. Installer les navigateurs : `npx playwright install --with-deps chromium`

### Strict mode violations

Si un sélecteur trouve plusieurs éléments, utiliser :
- `.first()` pour le premier élément
- `.getByRole()` pour plus de précision
- `.nth(index)` pour un élément spécifique

## 📧 Contact

Pour toute question : support@ravito.ci

---

**Prêt pour le Go-to-Market en Côte d'Ivoire 🇨🇮**
