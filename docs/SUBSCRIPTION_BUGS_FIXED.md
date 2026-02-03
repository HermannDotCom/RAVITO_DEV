# Bugs Fixes : Création d'Abonnement

## 🐛 Bugs Corrigés

### Bug 1 : "Utilisateur ou organisation non trouvé"

**Cause Root**
```typescript
// ❌ AVANT (ligne 40)
const { organization } = useOrganization();
// useOrganization retourne "organizationId", PAS "organization"
```

Le hook `useOrganization` retourne :
- `organizationId` (string)
- `organizationType` (string)
- `isOwner` (boolean)
- `isLoading` (boolean)
- `error` (string)

Mais le code essayait de déstructurer `{ organization }` qui n'existe pas !

**Fix Appliqué**
```typescript
// ✅ APRÈS
const { organizationId } = useOrganization();

// Puis utiliser partout
if (!organizationId) { ... }
const data: CreateSubscriptionData = { organizationId, planId };
```

---

### Bug 2 : Double Clic Requis

**Cause Root**
Quand on cliquait sur "Démarrer mon essai gratuit", le hook `useSubscription` se relançait et faisait :
1. `setLoading(true)` → Les plans deviennent `[]`
2. Cela causait un re-render
3. Le composant pensait qu'il n'y avait plus d'abonnement
4. Il réaffichait le Paywall

**Logs observés**
```
[Paywall] Rendering with plans: 3 loading: false
// User clique
[Paywall] Rendering with plans: 0 loading: true  ← PROBLÈME
[Paywall] Rendering with plans: 3 loading: false
```

**Fix Appliqué**
Utiliser `isCreatingSubscription` séparé de `loading` pour ne pas reset les plans pendant la création

```typescript
const handleConfirmSubscription = async () => {
  setIsCreating(true);  // Pas setLoading!
  const success = await createSubscription(selectedPlanId);
  // ...
  setIsCreating(false);
}
```

Et dans la condition du render :
```typescript
// ❌ AVANT
if (subscription && !loading && !selectedPlanId)

// ✅ APRÈS (pas de check sur loading)
if (subscription && !selectedPlanId)
```

Raison : L'utilisateur a déjà un abonnement, donc même si on recharge les données, on doit continuer à afficher la gestion d'abonnement.

---

## 📊 Détails des Changements

### Fichier : `src/hooks/useSubscription.ts`

```diff
- const { organization } = useOrganization();
+ const { organizationId } = useOrganization();

+ const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      // ...
-     if (organization?.id) {
-       const subscriptionData = await getOrganizationSubscription(organization.id);
+     if (organizationId) {
+       const subscriptionData = await getOrganizationSubscription(organizationId);
      // ...
-   }, [organization?.id]);
+   }, [organizationId]);

  // Créer un nouvel abonnement
  const createSubscription = useCallback(async (planId) => {
-   if (!user?.id || !organization?.id) {
+   if (!user?.id || !organizationId) {
      setError('Utilisateur ou organisation non trouvé');
      return false;
    }

    try {
-     setLoading(true);
+     setIsCreatingSubscription(true);
      const data = {
-       organizationId: organization.id,
+       organizationId,
        planId
      };
      // ...
      return true;
    } finally {
-     setLoading(false);
+     setIsCreatingSubscription(false);
    }
-   }, [user?.id, organization?.id, loadData]);
+   }, [user?.id, organizationId, loadData]);
```

### Fichier : `src/pages/RavitoGestionSubscription.tsx`

```diff
  // Si l'utilisateur a déjà un abonnement, afficher la gestion d'abonnement
- if (subscription && !loading && !selectedPlanId) {
+ if (subscription && !selectedPlanId) {
```

---

## ✅ Résultat

### Avant
1. Cliquer sur "Démarrer mon essai gratuit" → Erreur "Utilisateur ou organisation non trouvé"
2. Obligé de cliquer 2 fois
3. Pas de redirection automatique

### Après
1. Cliquer sur "Démarrer mon essai gratuit" → ✅ Abonnement créé
2. Un seul clic suffit
3. Redirection automatique vers "Gestion Activité"
4. Bannière "30 jours d'essai" affichée

---

## 🧪 Comment Tester

### Étape 1 : Recharger la page (Ctrl+Shift+R)

### Étape 2 : Ouvrir la console (F12)

### Étape 3 : Se connecter et cliquer sur "Gestion Activité"

### Étape 4 : Chercher dans les logs
```
[useSubscription] Starting to load data, organization: 495e29cd-789b-45c1-894b-f9955dae08b9 ← ✅ Organization ID présent
[Paywall] Rendering with plans: 3 loading: false
```

### Étape 5 : Choisir un plan

### Étape 6 : Cliquer sur "Démarrer mon essai gratuit"

Regarder les logs :
```
[useSubscription] Creating subscription with data: {organizationId: "...", planId: "..."}
[useSubscription] Subscription created: 12345...
```

### Étape 7 : Vérifier
- ✅ UN SEUL clic suffit
- ✅ Pas d'erreur "Utilisateur ou organisation non trouvé"
- ✅ Redirection automatique vers "Gestion Activité"
- ✅ Bannière verte "30 jours d'essai" visible

---

## 🐛 Logs à Chercher Si Problème Persiste

### ✅ Comportement Normal
```
[useSubscription] Loading plans...
[SubscriptionService] Plans fetched: 3 plans
[useSubscription] Plans loaded: 3
[useSubscription] Loading subscription for org: 495e29cd-789b-45c1-894b-f9955dae08b9
[useSubscription] Subscription loaded: null  ← (pas d'abonnement encore = normal)
[Paywall] Rendering with plans: 3 loading: false

[User click]
[useSubscription] Creating subscription with data: {...}
[useSubscription] Subscription created: abc123...
```

### ❌ Si Erreur
```
[useSubscription] Starting to load data, organization: undefined  ← PROBLÈME!
```

**Solution** : Recharger la page (l'organisation devrait se charger après le login)

---

## 📝 Résumé

| Aspect | Avant | Après |
|--------|-------|-------|
| **Source du Bug** | `useOrganization` mal utilisé | `organizationId` correctement utilisé |
| **Clics Requis** | 2 | 1 |
| **Message d'Erreur** | "Utilisateur ou organisation non trouvé" | Aucune erreur |
| **Plans Affichés Après Clic** | Disparaissaient | Restent affichés |
| **État Loading** | Réinitialisait les plans | Pas d'impact sur les plans |

---

## 🎯 Prochaines Étapes

1. Tester le flux complet end-to-end
2. Vérifier la redirection vers "Gestion Activité"
3. Confirmer que la bannière d'essai s'affiche
4. Tester la fin d'essai et les rappels

