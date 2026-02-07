# 🔄 Plan de Rollback RAVITO Gestion

**Version :** v1.6.3  
**Date :** 14 février 2026

---

## ⚠️ Quand déclencher un rollback ?

- Erreurs critiques empêchant l'utilisation de l'app
- Perte de données utilisateur
- Faille de sécurité détectée
- Performance dégradée (> 10s de chargement)
- Taux d'erreur > 5% dans Sentry

---

## 🚨 Procédure de Rollback

### Niveau 1 : Rollback Application (< 5 min)

**Symptômes :** Bug UI, erreur JavaScript, problème d'affichage

#### Vercel

```bash
# Lister les déploiements
vercel ls

# Rollback vers le déploiement précédent
vercel rollback [deployment-url]

# OU via Dashboard
# 1. Aller sur https://vercel.com/dashboard
# 2. Sélectionner le projet
# 3. Deployments → Cliquer sur "..." du déploiement précédent
# 4. "Promote to Production"
```

#### Netlify

```bash
# Via CLI
netlify rollback

# OU via Dashboard
# 1. Aller sur https://app.netlify.com
# 2. Sélectionner le site
# 3. Deploys → Cliquer sur le déploiement précédent
# 4. "Publish deploy"
```

---

### Niveau 2 : Rollback Edge Functions (< 10 min)

**Symptômes :** Emails non envoyés, notifications cassées

```bash
# 1. Identifier la version précédente
# (noter les versions avant MEP)

# 2. Redéployer depuis le commit précédent
git checkout [commit-hash-precedent]
supabase functions deploy send-email
supabase functions deploy send-notification

# 3. Revenir sur la branche principale
git checkout RAVITO_Gestion
```

**Alternative :** Désactiver temporairement la fonction

```bash
# Supprimer la fonction (arrête l'exécution)
supabase functions delete send-email

# L'app fonctionnera sans emails
# Redéployer une version corrigée ensuite
```

---

### Niveau 3 : Rollback Base de Données (< 30 min)

**Symptômes :** Données corrompues, migration échouée

#### Option A : Point-in-Time Recovery (PITR)

1. Aller sur Supabase Dashboard
2. Settings → Database → Backups
3. Sélectionner "Point in Time Recovery"
4. Choisir un timestamp avant la MEP
5. Confirmer la restauration

⚠️ **Attention :** Toutes les données après ce timestamp seront perdues.

#### Option B : Restaurer depuis Backup Manuel

1. Aller sur Supabase Dashboard
2. Settings → Database → Backups
3. Sélectionner le backup manuel créé avant MEP
4. Cliquer sur "Restore"

#### Option C : Rollback Migration Manuel

Si une migration spécifique pose problème :

```sql
-- Exemple : annuler l'ajout d'une colonne
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column;

-- Exemple : annuler la création d'une table
DROP TABLE IF EXISTS new_table;
```

---

### Niveau 4 : Mode Maintenance (immédiat)

**Symptômes :** Problème critique, besoin de temps pour investiguer

#### Vercel

1. Dashboard → Settings → General
2. Activer "Maintenance Mode"
3. Configurer la page de maintenance

#### Netlify

1. Dashboard → Site settings → Build & deploy
2. Stop auto publishing
3. Déployer une page de maintenance statique

#### Alternative : Redirect DNS

Pointer temporairement le DNS vers une page de maintenance hébergée ailleurs.

---

## 📋 Checklist Post-Rollback

- [ ] Vérifier que le site fonctionne
- [ ] Vérifier les données utilisateurs
- [ ] Notifier les utilisateurs si nécessaire
- [ ] Documenter l'incident
- [ ] Planifier la correction

---

## 📝 Template Rapport d'Incident

```markdown
## Rapport d'Incident - [DATE]

**Heure de détection :** ___:___
**Heure de résolution :** ___:___
**Durée d'indisponibilité :** ___ minutes

### Description du problème
[Décrire le problème observé]

### Impact
- Nombre d'utilisateurs affectés : ___
- Fonctionnalités impactées : ___

### Cause racine
[Décrire la cause identifiée]

### Actions prises
1. [Action 1]
2. [Action 2]
3. [Action 3]

### Rollback effectué
- [ ] Application
- [ ] Edge Functions
- [ ] Base de données

### Actions correctives prévues
1. [Action corrective 1]
2. [Action corrective 2]

### Leçons apprises
[Points à améliorer pour éviter ce type d'incident]
```

---

## 📞 Escalade

| Niveau | Délai | Action |
|--------|-------|--------|
| 1 - Warning | 5 min | Monitoring attentif |
| 2 - Minor | 15 min | Rollback application |
| 3 - Major | 30 min | Rollback complet + notification |
| 4 - Critical | Immédiat | Mode maintenance + escalade |

---

## 🔗 Liens Utiles

- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com)
- [Sentry Dashboard](https://sentry.io)
- [Status Supabase](https://status.supabase.com)
