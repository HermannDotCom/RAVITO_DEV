# Configuration du Cron Job pour les Rappels d'Abonnement

Ce document explique comment configurer le cron job qui gère automatiquement les rappels d'abonnement, la suspension des comptes, et les notifications.

## 📋 Fonctionnalités du Cron Job

Le script `subscription-reminders` s'exécute quotidiennement et effectue les actions suivantes :

1. **Rappels de fin d'essai** : Envoie des notifications 7, 3 et 1 jours avant la fin de la période d'essai
2. **Rappels de paiement** : Envoie des notifications 7, 3 et 1 jours avant l'échéance des factures
3. **Suspension automatique** : Suspend les abonnements dont la période d'essai est terminée
4. **Factures en retard** : Marque automatiquement les factures comme "overdue"

## 🚀 Déploiement de l'Edge Function

### 1. Déployer la fonction

L'edge function est déjà créée dans `supabase/functions/subscription-reminders/index.ts`.

Pour la déployer :

```bash
# Via Supabase CLI (si vous l'avez installé)
supabase functions deploy subscription-reminders

# Ou via l'interface MCP de Claude Code
# La fonction sera déployée automatiquement
```

### 2. Configuration du Cron Job

#### Option A : Via Supabase Dashboard (Recommandé)

1. Ouvrez votre projet Supabase : https://app.supabase.com
2. Allez dans **Database** → **Cron Jobs** (ou **Extensions** → **pg_cron**)
3. Activez l'extension `pg_cron` si ce n'est pas déjà fait
4. Créez un nouveau cron job avec ce SQL :

```sql
-- Activer l'extension pg_cron (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job qui s'exécute tous les jours à 9h00 UTC
SELECT cron.schedule(
  'subscription-reminders-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/subscription-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    ) as request_id;
  $$
);
```

**Important** : Remplacez `YOUR_PROJECT_REF` par la référence de votre projet Supabase.

#### Option B : Via SQL Editor

1. Ouvrez le SQL Editor dans Supabase Dashboard
2. Exécutez les commandes ci-dessus

### 3. Vérifier que le Cron Job fonctionne

```sql
-- Voir tous les cron jobs configurés
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
WHERE jobname = 'subscription-reminders-daily'
ORDER BY start_time DESC
LIMIT 10;
```

### 4. Tester Manuellement

Vous pouvez tester la fonction manuellement sans attendre le cron :

```bash
# Via curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/subscription-reminders \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

Ou via l'interface Supabase Dashboard → Edge Functions → subscription-reminders → "Invoke Function"

## 📅 Calendrier des Rappels

### Rappels de fin d'essai
- **J-7** : "Votre essai se termine dans 7 jours"
- **J-3** : "Votre essai se termine dans 3 jours"
- **J-1** : "Votre essai se termine demain"
- **J-0** : Suspension automatique + notification

### Rappels de paiement
- **J-7** : "Paiement dû dans 7 jours"
- **J-3** : "Paiement dû dans 3 jours"
- **J-1** : "Paiement dû demain"
- **J-0** : "Paiement dû aujourd'hui"
- **J+N** : "Paiement en retard de N jours"

## 🔧 Configuration Personnalisée

### Modifier l'heure d'exécution

Pour changer l'heure d'exécution du cron job :

```sql
-- S'exécute à 8h00 UTC au lieu de 9h00
SELECT cron.schedule(
  'subscription-reminders-daily',
  '0 8 * * *',  -- Modifiez ici (format: minute heure jour mois jour_semaine)
  $$
  SELECT net.http_post(...)
  $$
);
```

### Modifier les jours de rappel

Les jours de rappel sont configurés dans la table `subscription_settings` :

```sql
-- Voir la configuration actuelle
SELECT reminder_days FROM subscription_settings;

-- Modifier les jours de rappel
UPDATE subscription_settings
SET reminder_days = '{
  "monthly": [15, 7, 2],
  "semesterly": [60, 30, 15],
  "annually": [90, 60, 30, 15]
}'::jsonb;
```

### Désactiver la suspension automatique

```sql
UPDATE subscription_settings
SET auto_suspend_after_trial = false;
```

## 🐛 Dépannage

### Le cron job ne s'exécute pas

1. Vérifiez que `pg_cron` est activé :
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Vérifiez les erreurs dans les logs :
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'subscription-reminders-daily'
AND status = 'failed'
ORDER BY start_time DESC;
```

3. Vérifiez que l'URL de l'edge function est correcte

### Les notifications ne sont pas envoyées

1. Vérifiez que la table `notifications` existe et est accessible
2. Vérifiez les logs de l'edge function dans Supabase Dashboard → Edge Functions → Logs
3. Testez manuellement la fonction pour voir les erreurs

### Désactiver temporairement le cron job

```sql
-- Désactiver
SELECT cron.unschedule('subscription-reminders-daily');

-- Réactiver
SELECT cron.schedule(...);  -- Utilisez la commande complète ci-dessus
```

## 📊 Monitoring

### Voir les statistiques d'exécution

```sql
-- Nombre de rappels envoyés aujourd'hui
SELECT COUNT(*)
FROM subscription_reminders
WHERE DATE(sent_at) = CURRENT_DATE;

-- Abonnements suspendus aujourd'hui
SELECT COUNT(*)
FROM subscriptions
WHERE status = 'pending_payment'
AND DATE(suspended_at) = CURRENT_DATE;
```

### Dashboard Admin

Les administrateurs peuvent voir un résumé dans l'onglet "Paramètres" de la page "Gestion d'abonnements".

## 🚨 Important

- **Fuseau horaire** : Le cron s'exécute en UTC. Ajustez l'heure en fonction de votre fuseau horaire local.
- **Rate limiting** : L'edge function est limitée par les quotas Supabase. Surveillez votre usage.
- **Coûts** : Chaque exécution du cron compte dans votre quota d'invocations Edge Functions.

## 💡 Conseils

1. **Commencez par tester manuellement** avant de configurer le cron
2. **Surveillez les logs** pendant la première semaine
3. **Configurez des alertes** pour les échecs de cron job
4. **Documentez les modifications** de configuration

## 📞 Support

En cas de problème :
1. Vérifiez les logs Supabase
2. Consultez la documentation pg_cron : https://github.com/citusdata/pg_cron
3. Contactez le support Supabase si nécessaire
