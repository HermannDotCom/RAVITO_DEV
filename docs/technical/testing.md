# 🧪 Tests et Qualité

Documentation complète de l'infrastructure de tests de RAVITO.

---

## Infrastructure de Tests

### Stack de Tests

**Technologies installées :**
- **Vitest** (v3.2.4) - Framework de tests rapide, compatible Vite
- **@testing-library/react** (v16.3.0) - Tests de composants React
- **@testing-library/jest-dom** (v6.9.1) - Matchers personnalisés
- **@testing-library/user-event** (v14.6.1) - Simulation d'interactions utilisateur
- **jsdom** (v27.0.0) - DOM virtuel pour les tests
- **@vitest/ui** (v3.2.4) - Interface graphique pour les tests
- **@playwright/test** (v1.40.0) - Tests end-to-end

### Configuration

**vitest.config.ts :**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/demoAccounts.ts',
      ],
    },
  },
});
```

### Scripts NPM

```bash
# Tests unitaires
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once
npm run test:ui       # Open UI dashboard
npm run test:coverage # Generate coverage report

# Tests end-to-end
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests with browser
npm run test:e2e:debug   # Debug E2E tests
npm run test:e2e:report  # Show E2E test report
```

---

## Tests Unitaires

### Setup Global

**src/test/setup.ts :**
- Mock automatique de Supabase client
- Mock des fonctions auth
- Mock des opérations database
- Configuration de cleanup automatique

### Test Utilities

**src/test/test-utils.tsx :**

Fournit des wrappers de providers pour les tests :

```typescript
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { CommissionProvider } from '../context/CommissionContext';
import { OrderProvider } from '../context/OrderContext';

const AllTheProviders = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <CommissionProvider>
          <OrderProvider>
            {children}
          </OrderProvider>
        </CommissionProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });
```

**Utilisation dans les tests :**
```typescript
import { render, screen } from '../test/test-utils';

test('renders component with all contexts', () => {
  render(<MyComponent />);
  expect(screen.getByText('...')).toBeInTheDocument();
});
```

### Exemples de Tests

#### Tests de Contexte (CartContext)

**Fichier :** `src/context/__tests__/CartContext.test.tsx`

```typescript
describe('CartContext', () => {
  test('initializes with empty cart', () => {
    // Test implementation
  });

  test('adds product to cart', () => {
    // Test implementation
  });

  test('updates product quantity', () => {
    // Test implementation
  });

  test('removes product from cart', () => {
    // Test implementation
  });

  test('clears entire cart', () => {
    // Test implementation
  });
});
```

#### Tests de Validation

**Fichier :** `src/utils/__tests__/validation.test.ts`

```typescript
describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('validates Ivory Coast phone numbers', () => {
      expect(isValidPhone('+225 07 12 34 56 78')).toBe(true);
    });
  });
});
```

---

## Tests End-to-End (E2E)

### Configuration Playwright

**playwright.config.ts :**

Les tests E2E utilisent Playwright pour tester l'application complète dans un navigateur réel.

### Structure des Tests E2E

```
e2e/
├── auth.spec.ts          # Tests d'authentification
├── client.spec.ts        # Tests du parcours client
├── supplier.spec.ts      # Tests du parcours fournisseur
└── admin.spec.ts         # Tests du parcours admin
```

### Exemple de Test E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Client Flow', () => {
  test('can browse catalog and add to cart', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('text=Catalogue');
    await page.click('button:has-text("Ajouter au panier")');
    await expect(page.locator('.cart-badge')).toContainText('1');
  });
});
```

---

## Accessibilité (WCAG 2.1)

### Composants d'Accessibilité

#### SkipLink

Permet aux utilisateurs de clavier de sauter directement au contenu principal.

```typescript
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute
                 focus:top-4 focus:left-4 focus:z-50
                 focus:px-4 focus:py-2 focus:bg-blue-600
                 focus:text-white focus:rounded-lg"
    >
      Aller au contenu principal
    </a>
  );
};
```

#### VisuallyHidden

Masque visuellement le contenu tout en le gardant accessible aux lecteurs d'écran.

```typescript
<VisuallyHidden>
  Nombre d'articles dans le panier: {count}
</VisuallyHidden>
```

#### LoadingSpinner

Spinner accessible avec attributs ARIA appropriés.

```typescript
<LoadingSpinner
  size="lg"
  aria-label="Chargement en cours"
/>
```

### CSS Utilities

```css
@layer utilities {
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .focus-visible:focus {
    outline: 2px solid theme('colors.blue.600');
    outline-offset: 2px;
  }
}
```

### Checklist WCAG 2.1 Niveau AA

**Complété :**
- ✅ 1.3.1 Info and Relationships - Structure sémantique HTML
- ✅ 2.1.1 Keyboard - Navigation clavier complète
- ✅ 2.4.1 Bypass Blocks - SkipLink implémenté
- ✅ 3.1.1 Language of Page - lang="fr" sur HTML
- ✅ 4.1.2 Name, Role, Value - Attributs ARIA appropriés
- ✅ 1.4.3 Contrast - Contraste minimum 4.5:1
- ✅ 2.4.6 Headings and Labels - Hiérarchie de titres correcte
- ✅ 2.4.7 Focus Visible - Indicateurs de focus visibles
- ✅ 3.2.3 Consistent Navigation - Navigation cohérente

---

## Optimisations de Performance

### Utilities de Performance

**Fichier :** `src/utils/performance.ts`

#### Debounce

Retarde l'exécution d'une fonction jusqu'à ce qu'un délai se soit écoulé.

```typescript
const debouncedSearch = debounce((query: string) => {
  searchProducts(query);
}, 300);
```

**Cas d'usage :**
- Recherche en temps réel
- Auto-save de formulaires
- Resize handlers

#### Throttle

Limite le taux d'exécution d'une fonction.

```typescript
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

**Cas d'usage :**
- Scroll events
- Window resize
- Mouse move tracking

#### useDebounce Hook

```typescript
const SearchComponent = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
};
```

#### useIntersectionObserver

Détecte quand un élément est visible dans le viewport.

```typescript
const ImageComponent = () => {
  const ref = useRef<HTMLImageElement>(null);
  const isVisible = useIntersectionObserver(ref);

  return (
    <div ref={ref}>
      {isVisible && <img src={largeSrc} />}
    </div>
  );
};
```

**Cas d'usage :**
- Lazy loading d'images
- Infinite scroll
- Analytics (tracking visibilité)

---

## Bonnes Pratiques

### Tests

1. **Isoler les tests** - Chaque test doit être indépendant
2. **Utiliser des données de test** - Ne pas dépendre de données réelles
3. **Tester les comportements, pas l'implémentation** - Focus sur ce que fait le code, pas comment
4. **Nommer clairement les tests** - Le nom doit décrire ce qui est testé
5. **Maintenir une bonne couverture** - Viser 80%+ sur le code critique

### Accessibilité

1. **Tester avec le clavier** - Toute l'application doit être navigable au clavier
2. **Utiliser des lecteurs d'écran** - Tester avec NVDA, JAWS ou VoiceOver
3. **Vérifier les contrastes** - Utiliser des outils comme WebAIM Contrast Checker
4. **Ajouter des labels ARIA** - Pour les éléments interactifs
5. **Structure sémantique** - Utiliser les bonnes balises HTML

### Performance

1. **Debouncer les recherches** - Éviter trop de requêtes
2. **Lazy load les images** - Charger uniquement ce qui est visible
3. **Memoizer les calculs coûteux** - Utiliser useMemo et useCallback
4. **Code splitting** - Charger le code à la demande
5. **Optimiser les re-renders** - Utiliser React.memo quand approprié

---

## Commandes Utiles

```bash
# Lancer tous les tests
npm test

# Lancer les tests avec couverture
npm run test:coverage

# Lancer l'interface graphique des tests
npm run test:ui

# Lancer les tests E2E
npm run test:e2e

# Débugger un test E2E
npm run test:e2e:debug

# Build et preview
npm run build && npm run preview
```

---

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Qualité d'abord !** ✨
