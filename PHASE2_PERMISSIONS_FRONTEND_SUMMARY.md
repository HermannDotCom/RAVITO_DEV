# Phase 2: Système de Gestion des Permissions - Hooks et Logique Frontend

## Résumé de l'implémentation

Cette PR implémente les hooks React et composants frontend pour le système de permissions granulaires par module. Elle fonctionne en parallèle avec la Phase 1 (base de données) et inclut un **mode de compatibilité** pour fonctionner même si les tables n'existent pas encore.

## Fichiers créés

### 1. Types TypeScript
**`src/types/permissions.ts`**
- `InterfaceType`: Type d'interface ('supplier' | 'client' | 'admin')
- `AvailableModule`: Structure d'un module disponible
- `UserModulePermission`: Permission d'un utilisateur sur un module
- `ModulePermissionWithDetails`: Permission avec détails du module
- `PermissionAssignment`: Affectation de permission
- `ModuleAccessState`: État d'accès aux modules

### 2. Hooks React

**`src/hooks/useModuleAccess.ts`**
Hook principal pour vérifier l'accès aux modules:
- Charge les permissions depuis `user_module_permissions`
- Vérifie si l'utilisateur est propriétaire ou super admin
- Mode de compatibilité si les tables n'existent pas
- Cache les permissions pour éviter les requêtes répétées
- Propriétaire = accès à tout dans son interface
- Super Admin = accès à tout dans l'interface admin

**API:**
```typescript
interface UseModuleAccessReturn {
  hasAccess: (moduleKey: string) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  isOwner: boolean;
  isSuperAdmin: boolean;
  availableModules: AvailableModule[];
}
```

**`src/hooks/useUserPermissions.ts`**
Hook pour gérer les permissions des membres d'équipe:
- Charger les permissions d'un ou tous les membres
- Modifier les permissions d'un membre
- Vérifier si l'utilisateur courant peut modifier les permissions
- Respecte la hiérarchie: un gérant ne peut affecter que les modules auxquels il a accès

**API:**
```typescript
interface UseUserPermissionsReturn {
  memberPermissions: Map<string, UserModulePermission[]>;
  isLoading: boolean;
  error: string | null;
  loadMemberPermissions: (userId: string) => Promise<void>;
  loadAllMembersPermissions: () => Promise<void>;
  updatePermission: (userId: string, moduleKey: string, hasAccess: boolean) => Promise<boolean>;
  updateMultiplePermissions: (userId: string, assignments: PermissionAssignment[]) => Promise<boolean>;
  canManagePermissions: boolean;
  canAssignModule: (moduleKey: string) => boolean;
  getAssignableModules: () => AvailableModule[];
}
```

### 3. Composants

**`src/components/Auth/ProtectedModule.tsx`**
Composant wrapper pour protéger l'accès à un module/page:
```typescript
<ProtectedModule 
  moduleKey="orders" 
  showAccessDenied={true}
  onAccessDenied={() => navigate('/dashboard')}
>
  <OrdersPage />
</ProtectedModule>
```

**`AccessDeniedMessage`**
Message par défaut affiché quand l'accès est refusé.

**`src/context/PermissionContext.tsx`**
Provider de contexte pour centraliser la gestion des permissions:
- Évite de recharger les permissions dans chaque composant
- Fournit les permissions via `usePermissionContext()`

## Fichiers modifiés

### 1. `src/types/index.ts`
- Export des nouveaux types de permissions

### 2. `src/components/Layout/Sidebar.tsx`
- Import de `useModuleAccess`
- Ajout de `moduleKey` à chaque élément de menu
- Filtrage des éléments selon les permissions de l'utilisateur
```typescript
const mainMenuItems = getMainMenuItems();
// Filtre les éléments selon hasAccess(moduleKey)
```

### 3. `src/App.tsx`
- Ajout du `PermissionProvider` dans la hiérarchie des providers
```typescript
<AuthProvider>
  <NotificationProvider>
    <ToastProvider>
      <PermissionProvider>
        {/* ... autres providers ... */}
      </PermissionProvider>
    </ToastProvider>
  </NotificationProvider>
</AuthProvider>
```

### 4. `src/components/Auth/index.ts`
- Export de `ProtectedModule` et `AccessDeniedMessage`

## Logique de vérification d'accès

La fonction `hasAccess()` vérifie l'accès dans cet ordre:

1. **En cours de chargement** → Autoriser (éviter flash de contenu refusé)
2. **Pas d'utilisateur** → Refuser
3. **Super Admin + interface admin** → Autoriser
4. **Module super_admin_only sans être super admin** → Refuser
5. **Propriétaire** → Autoriser tout dans son interface
6. **Module is_always_accessible** → Autoriser
7. **Vérifier permissions spécifiques** → Selon `user_module_permissions`

## Mode de compatibilité

Le système inclut un mode de repli (fallback) pour fonctionner sans les tables de base de données:

```typescript
// Détection automatique si les tables n'existent pas
if (error.code === '42P01') {
  console.warn('Permissions table not found - using fallback mode');
  setFallbackMode(true);
}

// En mode fallback:
// - Propriétaire → accès à tout
// - Super Admin → accès à tout dans admin
// - Autres → pas d'accès
```

## Règles métier

### Gestion des permissions (useUserPermissions)

1. **Qui peut gérer les permissions?**
   - Le propriétaire de l'organisation
   - Les membres avec accès au module "team"

2. **Quels modules peut-on affecter?**
   - Propriétaire: tous les modules (sauf super_admin_only)
   - Gérant: seulement les modules auxquels il a lui-même accès

3. **Restrictions:**
   - On ne peut pas modifier les permissions du propriétaire
   - Les modules `is_super_admin_only` ne peuvent être affectés que par le Super Admin

## Tests

**`src/hooks/__tests__/useModuleAccess.test.ts`**
- Tests unitaires pour le hook `useModuleAccess`
- Vérifie l'initialisation, les fonctions, et le mode fallback
- ✅ Tous les tests passent

## Sécurité

### Vérifications effectuées:
- ✅ Pas d'utilisation de `eval()`
- ✅ Pas de `dangerouslySetInnerHTML`
- ✅ Pas de `window.location.href` (remplacé par callback)
- ✅ Validation des permissions côté frontend ET backend (RLS)
- ✅ Gestion sécurisée des erreurs de base de données
- ✅ Mode fallback conservateur (deny by default)

### Notes de sécurité:
- Les permissions frontend sont pour l'UX seulement
- Les RLS policies de Supabase assurent la sécurité réelle
- Le mode fallback est conservateur (accès limité)

## Build et déploiement

```bash
# Build réussi
npm run build
✓ built in 18.27s

# Tests réussis
npm test
✓ 6 tests passed
```

## Utilisation

### Dans un composant:
```typescript
import { useModuleAccess } from '../hooks/useModuleAccess';

function MyComponent() {
  const { hasAccess, isLoading } = useModuleAccess();
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {hasAccess('orders') && <OrdersSection />}
      {hasAccess('team') && <TeamSection />}
    </div>
  );
}
```

### Protection de route:
```typescript
import { ProtectedModule } from '../components/Auth/ProtectedModule';

<ProtectedModule moduleKey="orders">
  <OrdersPage />
</ProtectedModule>
```

### Via Context:
```typescript
import { usePermissionContext } from '../context/PermissionContext';

function MyComponent() {
  const { hasAccess, isOwner, isSuperAdmin } = usePermissionContext();
  // ...
}
```

## Prochaines étapes

Pour activer complètement le système:
1. Merger la Phase 1 (migrations base de données)
2. Populer la table `available_modules` avec les modules de l'app
3. Créer une interface admin pour gérer les permissions
4. Ajouter des modules "owner_only" et "super_admin_only" selon les besoins

## Compatibilité

✅ **Fonctionne AVANT le merge de Phase 1**
- Mode fallback activé automatiquement
- Propriétaire et Super Admin ont les accès attendus
- Aucune erreur dans la console

✅ **Fonctionne APRÈS le merge de Phase 1**
- Détecte automatiquement les tables
- Charge les permissions depuis la base de données
- Respect total des permissions granulaires

## Points d'attention

1. **organizationId**: Le hook `useUserPermissions` nécessite un `organizationId` pour fonctionner. Le fournir depuis le contexte Auth ou similaire.

2. **Super Admin**: Nécessite à la fois:
   - `role = 'admin'` dans la table `profiles`
   - `role = 'super_admin'` dans la table `organization_members`

3. **Modules always accessible**: Les modules comme "profile" doivent être marqués `is_always_accessible = true` dans la table `available_modules`.

4. **Performance**: Le `PermissionProvider` charge les permissions une seule fois au montage. Pour rafraîchir: appeler `refreshPermissions()`.

## Conclusion

✅ Implémentation complète et fonctionnelle
✅ Mode de compatibilité pour déploiement progressif
✅ Tests passent
✅ Build réussit
✅ Pas de régression
✅ Code review feedback intégré
✅ Prêt pour merge
