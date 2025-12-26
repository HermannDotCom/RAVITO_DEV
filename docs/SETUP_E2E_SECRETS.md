# Configuration des Secrets pour les Tests E2E

Pour que les tests E2E fonctionnent dans GitHub Actions, vous devez configurer les secrets suivants :

## Configuration

1. Allez dans **Settings → Secrets and variables → Actions**
2. Cliquez sur **New repository secret**
3. Ajoutez les secrets suivants :

| Nom du Secret | Valeur |
|---------------|--------|
| `VITE_SUPABASE_URL` | Votre URL Supabase (ex: `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Votre clé anon Supabase |

## Où trouver ces valeurs ?

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings → API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

⚠️ **Ne jamais exposer la `service_role` key !** Seule la clé `anon` est sécuritaire pour le frontend.
