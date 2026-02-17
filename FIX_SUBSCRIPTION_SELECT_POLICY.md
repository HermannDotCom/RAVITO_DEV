# Correction du Problème d'Abonnement - Politique SELECT

## Analyse du Problème Réel

### Erreur Persistante
```
byuwnxrfnfkxtmegyazj.supabase.co/rest/v1/subscriptions?select=*%2Csubscription_plans%28*%29:1
Failed to load resource: the server responded with a status of 403 ()
```

### Diagnostic
L'URL contient `select=*%2Csubscription_plans%28*%29`, ce qui indique que l'erreur 403 se produit lors du **SELECT**, pas de l'INSERT.

## Problème Identifié

### Politique SELECT Incorrecte
La politique `subscriptions_select_own` était définie comme :
```sql
USING (
  organization_id IN (
    SELECT organization_members.organization_id
    FROM organization_members
    WHERE organization_members.user_id = auth.uid()
  )
)
```

**Problème** : Cette politique vérifie uniquement `organization_members`, mais **ne vérifie pas** si l'utilisateur est le propriétaire de l'organisation via la table `organizations`.

### Conséquence
1. ✅ L'INSERT fonctionnait (politique INSERT corrigée précédemment)
2. ❌ Le SELECT échouait immédiatement après
3. Résultat : Le propriétaire d'organisation ne pouvait pas lire l'abonnement qu'il venait de créer

## Solution Appliquée

### Migration : `20260217010000_fix_subscription_select_for_owners.sql`

```sql
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;

CREATE POLICY "subscriptions_select_own"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur est le propriétaire de l'organisation
  EXISTS (
    SELECT 1
    FROM organizations
    WHERE organizations.id = subscriptions.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  -- OU l'utilisateur est un membre de l'organisation
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.organization_id = subscriptions.organization_id
    AND organization_members.user_id = auth.uid()
  )
);
```

### Politiques RLS Finales sur `subscriptions`

| Politique | Opération | Qui peut ? | Vérifie |
|-----------|-----------|------------|---------|
| `subscriptions_insert_own` | INSERT | Propriétaires et membres actifs | `organizations.owner_id` OU `organization_members.status = 'active'` |
| `subscriptions_select_own` | SELECT | Propriétaires et membres | `organizations.owner_id` OU `organization_members` (tous statuts) |
| `subscriptions_update_own` | UPDATE | Propriétaires et membres actifs | `organizations.owner_id` OU `organization_members.status = 'active'` |
| `subscriptions_select_admin` | SELECT | Admins | `profiles.role = 'admin'` |
| `subscriptions_all_super_admin` | ALL | Super admins | `profiles.is_super_admin = true` |

## Flux Complet Corrigé

### 1. Utilisateur Clique sur "Je m'abonne"
**Page** : `RavitoGestionSubscription.tsx`

### 2. Appel API - createSubscription
**Service** : `ravitoGestionSubscriptionService.ts`

```typescript
const { data: subscriptionData, error } = await supabase
  .from('subscriptions')
  .insert({
    organization_id: data.organizationId,
    plan_id: data.planId,
    status: 'trial',
    is_first_subscription: true,
    trial_start_date: trialStartDate.toISOString(),
    trial_end_date: trialEndDate.toISOString()
  })
  .select('*, subscription_plans (*)')  // <-- C'était ici le problème
  .single();
```

### 3. Supabase Vérifie les Politiques

#### INSERT (ligne `.insert()`)
✅ **Politique** : `subscriptions_insert_own`
✅ **Vérifie** : User est propriétaire OU membre actif
✅ **Résultat** : AUTORISÉ

#### SELECT (ligne `.select()`)
**AVANT** : ❌ Politique `subscriptions_select_own` ne vérifiait que `organization_members`
**APRÈS** : ✅ Politique vérifiée - User est propriétaire OU membre
✅ **Résultat** : AUTORISÉ

### 4. Abonnement Créé et Retourné
- ✅ Abonnement créé avec statut `trial`
- ✅ Données retournées avec `subscription_plans`
- ✅ Utilisateur redirigé vers Dashboard

## Test de Validation

### Étapes de Test
1. Se connecter avec un utilisateur approuvé (ex: julesguede@test.com)
2. Aller sur "Mon Abonnement"
3. Cliquer sur "Je m'abonne et je paie plus tard" (Plan Mensuel)
4. Confirmer

### Résultat Attendu
- ✅ Aucune erreur 403
- ✅ Abonnement créé
- ✅ Statut : `trial`
- ✅ Période d'essai : 30 jours
- ✅ Redirection vers Dashboard

### Console du Navigateur
**AVANT** :
```
Failed to load resource: 403
Error creating subscription
```

**APRÈS** :
```
(Aucune erreur)
Subscription created successfully
```

## Commandes de Debug

### 1. Vérifier les politiques actuelles
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;
```

### 2. Vérifier l'organisation de l'utilisateur
```sql
SELECT
  p.id as user_id,
  p.name,
  p.email,
  o.id as org_id,
  o.name as org_name,
  o.owner_id
FROM profiles p
LEFT JOIN organizations o ON o.owner_id = p.id
WHERE p.email = 'julesguede@test.com';
```

### 3. Test d'accès en lecture
```sql
-- Se connecter en tant qu'utilisateur dans Supabase Dashboard
SELECT *
FROM subscriptions
WHERE organization_id = 'ORG_ID_HERE';
```

## Migrations Appliquées

1. ✅ `fix_subscription_insert_allow_org_owners.sql` - Correction INSERT et UPDATE
2. ✅ `20260217010000_fix_subscription_select_for_owners.sql` - Correction SELECT

## Notes Importantes

### Différence INSERT vs SELECT
- **INSERT** : Nécessite `status = 'active'` pour les membres (protection contre création non autorisée)
- **SELECT** : Autorise tous les membres (même inactifs) pour permettre la lecture

### Pourquoi cette différence ?
- Les membres inactifs ne doivent pas créer/modifier des abonnements
- Mais ils doivent pouvoir voir l'abonnement existant de leur organisation

## Validation Complète

Pour valider que tout fonctionne :

1. ✅ Propriétaires peuvent créer des abonnements
2. ✅ Propriétaires peuvent lire leurs abonnements
3. ✅ Propriétaires peuvent mettre à jour leurs abonnements
4. ✅ Membres actifs peuvent créer des abonnements
5. ✅ Membres actifs peuvent lire les abonnements
6. ✅ Membres actifs peuvent mettre à jour les abonnements
7. ✅ Membres inactifs peuvent lire (mais pas créer/modifier)
8. ✅ Utilisateurs externes ne peuvent rien faire (403)

## Prochaines Étapes

Si l'erreur persiste malgré cette correction :

1. Vérifier que les migrations sont bien appliquées :
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version LIKE '%subscription%'
   ORDER BY version DESC;
   ```

2. Vérifier que l'utilisateur a bien une organisation :
   ```sql
   SELECT * FROM organizations WHERE owner_id = auth.uid();
   ```

3. Activer les logs RLS dans Supabase Dashboard :
   - Settings → API → Logs
   - Chercher les requêtes avec erreur 403

4. Tester manuellement la politique :
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub = 'USER_ID_HERE';
   SELECT * FROM subscriptions;
   ```
