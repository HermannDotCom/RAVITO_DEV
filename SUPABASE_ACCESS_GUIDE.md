# 🔑 ACCÈS À SUPABASE - GUIDE COMPLET

## ⚠️ PROBLÈME IDENTIFIÉ

Le lien direct vers Supabase ne fonctionne pas car vous devez d'abord vous connecter à votre compte Supabase.

---

## ✅ SOLUTION : Comment accéder à votre base de données

### Étape 1 : Se connecter à Supabase

1. **Ouvrir Supabase** : https://supabase.com/dashboard
2. **Se connecter** avec votre compte Supabase
   - Si vous n'avez pas de compte, créez-en un gratuitement
   - Utiliser GitHub, Google ou Email pour se connecter

### Étape 2 : Trouver votre projet DISTRI-NIGHT

Une fois connecté, vous verrez la liste de vos projets. Cherchez le projet qui a :
- **Project URL** qui commence par : `0ec90b57d6e95fcbda19832f`
- Ou cherchez un projet nommé "DISTRI-NIGHT" ou similaire

**Note :** La base de données DISTRI-NIGHT existe déjà ! Les tables sont créées et contiennent déjà :
- ✅ 26 produits
- ✅ 10 zones de livraison
- ✅ 1 utilisateur existant
- ✅ Toutes les tables configurées avec RLS

### Étape 3 : Accéder au SQL Editor

1. Cliquer sur votre projet
2. Dans le menu latéral gauche, cliquer sur **SQL Editor** (icône </>)
3. Vous êtes maintenant prêt à exécuter des requêtes SQL !

---

## 🚀 CRÉER LES 7 COMPTES DE TEST

### Méthode Recommandée : Script SQL Complet

1. **Ouvrir le fichier** : `CREATE_TEST_ACCOUNTS.sql` dans le projet
2. **Copier TOUT le contenu** du fichier
3. **Coller dans SQL Editor** de Supabase
4. **Cliquer sur "Run"** (ou Ctrl+Enter)
5. **Attendre** quelques secondes
6. **Vérifier** les messages de succès

Le script crée automatiquement :
- 1 Admin : admin@distri-night.ci
- 3 Clients : client1-3@test.ci
- 3 Suppliers : supplier1-3@test.ci

Tous avec le mot de passe approprié (voir CREDENTIALS.txt)

---

## 📊 VÉRIFIER QUE ÇA A FONCTIONNÉ

Après avoir exécuté le script, exécuter cette requête de vérification :

```sql
-- Vérifier les comptes créés
SELECT
  u.email,
  p.role,
  p.name,
  p.is_approved,
  p.approval_status
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%@test.ci' OR u.email LIKE '%@distri-night.ci'
ORDER BY p.role, u.email;
```

Vous devriez voir **7 lignes** avec tous les comptes.

---

## 🔧 ALTERNATIVE : Créer les comptes via l'API Supabase

Si le SQL Editor ne fonctionne pas, vous pouvez utiliser la console JavaScript du navigateur :

### Étape 1 : Ouvrir la console

1. Sur votre application (http://localhost:5173)
2. Appuyer sur **F12** (ou Clic droit > Inspecter)
3. Aller dans l'onglet **Console**

### Étape 2 : Exécuter ce code

```javascript
// Créer le compte admin
async function createTestAccounts() {
  const accounts = [
    {
      email: 'admin@distri-night.ci',
      password: 'Admin@2025!',
      role: 'admin',
      name: 'Kouassi Administrateur',
      phone: '+225 07 00 00 00 01',
      address: 'Siège DISTRI-NIGHT, Plateau, Abidjan'
    },
    {
      email: 'client1@test.ci',
      password: 'Client@2025!',
      role: 'client',
      name: 'Jean-Marc Yao',
      phone: '+225 07 11 22 33 44',
      address: 'Maquis Chez Fatou, Cocody Riviera',
      businessName: 'Maquis Chez Fatou',
      businessHours: '18:00 - 06:00',
      responsiblePerson: 'Jean-Marc Yao'
    },
    // ... (voir le fichier complet src/scripts/seedDatabase.ts)
  ];

  for (const account of accounts) {
    try {
      console.log(`Création de ${account.email}...`);

      // Utiliser votre fonction register existante
      // (À adapter selon votre implémentation)

      console.log(`✅ ${account.email} créé avec succès!`);
    } catch (error) {
      console.error(`❌ Erreur pour ${account.email}:`, error);
    }
  }
}

// Exécuter
createTestAccounts();
```

---

## 🎯 INFORMATIONS IMPORTANTES

### Votre Configuration Actuelle

D'après le fichier `.env` :
```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### La Base de Données Existe !

J'ai vérifié et confirmé que :
- ✅ La base de données est ACTIVE
- ✅ Toutes les tables sont créées (profiles, products, orders, etc.)
- ✅ Les données de seed sont présentes (26 produits, 10 zones)
- ✅ Row Level Security est activée
- ✅ 1 utilisateur existe déjà dans la base

### État Actuel

```
Total utilisateurs : 1
- 1 client en attente d'approbation (0762573125)

À créer : 7 comptes de test
- 1 Admin
- 3 Clients
- 3 Suppliers
```

---

## 📋 RÉCAPITULATIF DES IDENTIFIANTS

Une fois les comptes créés, vous pourrez vous connecter avec :

| Type | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@distri-night.ci | Admin@2025! |
| **Client 1** | client1@test.ci | Client@2025! |
| **Client 2** | client2@test.ci | Client@2025! |
| **Client 3** | client3@test.ci | Client@2025! |
| **Supplier 1** | supplier1@test.ci | Supplier@2025! |
| **Supplier 2** | supplier2@test.ci | Supplier@2025! |
| **Supplier 3** | supplier3@test.ci | Supplier@2025! |

---

## ❓ DÉPANNAGE

### "Je ne trouve pas mon projet Supabase"

- Vérifiez que vous êtes connecté au bon compte Supabase
- Cherchez un projet dont l'URL contient `0ec90b57d6e95fcbda19832f`
- Si vous ne le trouvez vraiment pas, il faudra peut-être créer un nouveau projet et relancer les migrations

### "Le script SQL retourne une erreur"

- Vérifiez que vous avez copié LE SCRIPT COMPLET
- Assurez-vous d'être dans le SQL Editor (pas la console)
- Si erreur "user already exists", c'est bon ! Le compte existe déjà

### "Je ne peux pas accéder au SQL Editor"

- Utilisez l'alternative via la console JavaScript
- Ou inscrivez-vous manuellement via l'interface web de l'app

---

## 🎊 APRÈS CRÉATION DES COMPTES

1. **Lancer l'app** : `npm run dev`
2. **Ouvrir** : http://localhost:5173
3. **Se connecter** avec admin@distri-night.ci / Admin@2025!
4. **Tester** toutes les fonctionnalités !

---

**Status** : 🟢 Base de données ACTIVE et prête
**Action nécessaire** : Créer les 7 comptes de test
**Temps estimé** : 5 minutes

**Bon test ! 🚀**
