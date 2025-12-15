# Configuration Resend pour RAVITO

Guide complet pour configurer et déployer le service d'envoi d'emails transactionnels via Resend.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [1. Création du compte Resend](#1-création-du-compte-resend)
- [2. Obtention de la clé API](#2-obtention-de-la-clé-api)
- [3. Configuration du domaine (Optionnel)](#3-configuration-du-domaine-optionnel)
- [4. Configuration des secrets Supabase](#4-configuration-des-secrets-supabase)
- [5. Déploiement de l'Edge Function](#5-déploiement-de-ledge-function)
- [6. Tests manuels](#6-tests-manuels)
- [7. Dépannage](#7-dépannage)

---

## Prérequis

- Compte Supabase actif avec CLI installé
- Accès aux variables d'environnement Supabase
- Terminal avec `supabase` CLI configuré

---

## 1. Création du compte Resend

### Étape 1.1 : Inscription

1. Rendez-vous sur [resend.com](https://resend.com)
2. Cliquez sur **"Sign Up"** ou **"Get Started"**
3. Créez votre compte avec :
   - Email professionnel (recommandé : votre email @ravito.ci)
   - Mot de passe sécurisé
4. Vérifiez votre email en cliquant sur le lien de confirmation

### Étape 1.2 : Compléter le profil

1. Connectez-vous à votre dashboard Resend
2. Complétez les informations de votre organisation :
   - **Organization Name** : RAVITO
   - **Industry** : E-commerce / Food Delivery
   - **Country** : Côte d'Ivoire

---

## 2. Obtention de la clé API

### Étape 2.1 : Créer une API Key

1. Dans le dashboard Resend, allez dans **API Keys** (menu latéral)
2. Cliquez sur **"Create API Key"**
3. Configurez la clé :
   - **Name** : `RAVITO Production` ou `RAVITO Development`
   - **Permission** : `Sending access` (Full access)
   - **Domain** : Sélectionnez votre domaine configuré ou laissez vide
4. Cliquez sur **"Create"**
5. **IMPORTANT** : Copiez immédiatement la clé API générée (elle ne sera plus affichée)
   - Format : `re_xxxxxxxxxxxxxxxxxxxxxxxx`
   - Stockez-la dans un endroit sécurisé (gestionnaire de mots de passe)

### Étape 2.2 : Tester la clé API (Optionnel)

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "votre-email@example.com",
    "subject": "Test RAVITO",
    "html": "<p>Test de configuration Resend pour RAVITO</p>"
  }'
```

---

## 3. Configuration du domaine (Optionnel)

> **Note** : Pour l'environnement de développement, vous pouvez utiliser `onboarding@resend.dev`. Pour la production, il est **fortement recommandé** de configurer votre propre domaine `ravito.ci`.

### Étape 3.1 : Ajouter votre domaine

1. Dans le dashboard Resend, allez dans **Domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine : `ravito.ci`
4. Cliquez sur **"Add"**

### Étape 3.2 : Configurer les enregistrements DNS

Resend vous fournira des enregistrements DNS à configurer chez votre registrar de domaine. Ajoutez ces enregistrements :

#### Enregistrements SPF, DKIM, DMARC

| Type  | Name                      | Value                                      | TTL  |
|-------|---------------------------|-------------------------------------------|------|
| TXT   | `@` ou `ravito.ci`        | `v=spf1 include:resend.com ~all`          | 3600 |
| TXT   | `resend._domainkey`       | *(valeur fournie par Resend - DKIM key)* | 3600 |
| TXT   | `_dmarc`                  | `v=DMARC1; p=none; rua=mailto:dmarc@ravito.ci` | 3600 |

### Étape 3.3 : Vérifier le domaine

1. Une fois les enregistrements DNS ajoutés (propagation : 24-48h max)
2. Retournez dans **Domains** sur Resend
3. Cliquez sur **"Verify"** à côté de votre domaine
4. Statut doit passer à ✅ **Verified**

### Étape 3.4 : Mettre à jour le secret Supabase (Optionnel)

Une fois le domaine vérifié, vous pouvez configurer l'adresse d'expédition via un secret Supabase :

```bash
# Configurer l'adresse d'expédition personnalisée
supabase secrets set EMAIL_FROM="RAVITO <noreply@ravito.ci>"
```

Si vous ne configurez pas ce secret, l'adresse par défaut `RAVITO <noreply@ravito.ci>` sera utilisée.

---

## 4. Configuration des secrets Supabase

### Étape 4.1 : Via Supabase CLI (Recommandé)

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Configurer les secrets
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# (Optionnel) Configurer l'adresse d'expédition
supabase secrets set EMAIL_FROM="RAVITO <noreply@ravito.ci>"
```

### Étape 4.2 : Via Dashboard Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet RAVITO
3. Allez dans **Settings** → **Edge Functions** → **Secrets**
4. Ajoutez le secret :
   - **Name** : `RESEND_API_KEY`
   - **Value** : `re_your_api_key_here` (votre clé API Resend)
5. (Optionnel) Ajoutez le secret pour personnaliser l'expéditeur :
   - **Name** : `EMAIL_FROM`
   - **Value** : `RAVITO <noreply@ravito.ci>` (ou votre domaine personnalisé)
6. Cliquez sur **"Save"**

### Étape 4.3 : Vérifier les secrets (déjà configurés)

Les secrets suivants doivent déjà être configurés automatiquement par Supabase :
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (avec droits élevés)

Pour vérifier :
```bash
supabase secrets list
```

---

## 5. Déploiement de l'Edge Function

### Étape 5.1 : Déployer la fonction

```bash
# Depuis la racine du projet
cd /path/to/DISTRI-NIGHT

# Déployer uniquement la fonction send-email
supabase functions deploy send-email --no-verify-jwt

# Ou déployer toutes les fonctions
supabase functions deploy
```

### Étape 5.2 : Vérifier le déploiement

```bash
# Lister les fonctions déployées
supabase functions list
```

Vous devriez voir :
```
send-email       deployed   https://[project-ref].supabase.co/functions/v1/send-email
```

### Étape 5.3 : Activer les logs (Optionnel)

Pour debug et monitoring :
```bash
# Suivre les logs en temps réel
supabase functions logs send-email --follow
```

---

## 6. Tests manuels

### Test 6.1 : Email de bienvenue

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "welcome",
    "to": "votre-email@example.com",
    "data": {
      "userName": "Jean Dupont",
      "userEmail": "votre-email@example.com",
      "role": "client",
      "businessName": "Restaurant Le Soleil",
      "dashboardUrl": "https://ravito.ci/dashboard"
    }
  }'
```

### Test 6.2 : Email de réinitialisation de mot de passe

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "password_reset",
    "to": "votre-email@example.com",
    "data": {
      "userName": "Jean Dupont",
      "userEmail": "votre-email@example.com",
      "resetUrl": "https://ravito.ci/reset-password?token=abc123",
      "expirationMinutes": 60
    }
  }'
```

### Test 6.3 : Email de nouvelle commande

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "new_order",
    "to": "fournisseur@example.com",
    "data": {
      "supplierName": "Fournisseur ABC",
      "orderId": "ORD-2024-001",
      "clientName": "Restaurant Le Soleil",
      "clientZone": "Cocody",
      "items": [
        { "name": "Riz parfumé", "quantity": 25, "unit": "kg" },
        { "name": "Huile végétale", "quantity": 10, "unit": "L" }
      ],
      "totalAmount": 125000,
      "dashboardUrl": "https://ravito.ci/supplier/orders"
    }
  }'
```

### Test 6.4 : Email de confirmation de livraison

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "delivery_confirmation",
    "to": "client@example.com",
    "data": {
      "clientName": "Jean",
      "clientEmail": "client@example.com",
      "orderId": "ORD-2024-001",
      "supplierName": "Fournisseur ABC",
      "deliveryTime": "Aujourd'\''hui à 14h30",
      "totalAmount": 125000,
      "ratingUrl": "https://ravito.ci/orders/ORD-2024-001/rate"
    }
  }'
```

### Test 6.5 : Vérification dans la base de données

```sql
-- Vérifier les logs d'emails envoyés
SELECT * FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 7. Dépannage

### Problème : "RESEND_API_KEY is not defined"

**Solution** :
1. Vérifiez que le secret est bien configuré :
   ```bash
   supabase secrets list
   ```
2. Si absent, ajoutez-le :
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```
3. Redéployez la fonction :
   ```bash
   supabase functions deploy send-email
   ```

---

### Problème : "Resend API error: 403 Forbidden"

**Causes possibles** :
1. Clé API invalide ou révoquée
2. Domaine non vérifié (si vous utilisez un domaine personnalisé)
3. Limites de taux atteintes (rate limiting)

**Solution** :
1. Vérifiez votre clé API dans le dashboard Resend
2. Vérifiez que votre domaine est bien vérifié
3. Consultez les limites de votre plan Resend

---

### Problème : Emails n'arrivent pas / Vont dans spam

**Solution** :
1. **Domaine personnalisé** : Configurez votre domaine `ravito.ci` (voir section 3)
2. **SPF, DKIM, DMARC** : Vérifiez que les enregistrements DNS sont corrects
3. **Contenu** : Évitez les mots "spam triggers" (gratuit, gagner, urgent, etc.)
4. **Volume** : Commencez avec un faible volume d'emails et augmentez progressivement
5. **Authentification** : Ajoutez un footer avec lien de désinscription

---

### Problème : "Failed to insert into email_logs"

**Solution** :
1. Vérifiez que la migration a été appliquée :
   ```bash
   supabase db diff
   ```
2. Si la table n'existe pas, appliquez la migration :
   ```bash
   supabase db push
   ```

---

### Problème : Erreur CORS

**Solution** : L'Edge Function inclut déjà les headers CORS. Si le problème persiste :
1. Vérifiez que vous appelez la fonction depuis un domaine autorisé
2. Vérifiez la configuration CORS de Supabase dans le dashboard

---

## 📊 Monitoring et Logs

### Consulter les logs Supabase

```bash
# Logs en temps réel
supabase functions logs send-email --follow

# Logs avec filtre d'erreur
supabase functions logs send-email --filter "error"
```

### Dashboard Resend

1. Allez dans **Emails** sur le dashboard Resend
2. Consultez :
   - Emails envoyés (sent)
   - Emails délivrés (delivered)
   - Emails ouverts (opened)
   - Emails cliqués (clicked)
   - Emails bounced / failed

### Logs en base de données

```sql
-- Statistiques par type d'email
SELECT type, status, COUNT(*) as count
FROM email_logs
GROUP BY type, status
ORDER BY count DESC;

-- Emails échoués récents
SELECT *
FROM email_logs
WHERE status != 'sent'
ORDER BY created_at DESC
LIMIT 20;

-- Taux de succès
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ **Ne jamais commit** la clé API Resend dans le code
2. ✅ **Utiliser des secrets** Supabase pour les clés sensibles
3. ✅ **Limiter les permissions** des clés API (sending only)
4. ✅ **Rotation des clés** : Changez votre clé API tous les 90 jours
5. ✅ **Monitoring** : Surveillez les logs pour détecter une utilisation anormale
6. ✅ **Rate limiting** : Supabase Edge Functions ont déjà un rate limiting intégré

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [API Resend](https://resend.com/docs/api-reference/emails/send-email)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Configuration DNS pour emails](https://resend.com/docs/dashboard/domains/introduction)

---

## 🆘 Support

En cas de problème :
1. Consultez la section **Dépannage** ci-dessus
2. Vérifiez les logs : `supabase functions logs send-email`
3. Consultez le dashboard Resend pour le statut des emails
4. Contactez l'équipe technique RAVITO

---

**Configuration effectuée le** : ________________  
**Par** : ________________  
**Domaine vérifié** : ☐ Oui ☐ Non  
**Tests réussis** : ☐ Oui ☐ Non
