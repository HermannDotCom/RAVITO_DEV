# Tests E2E - À Mettre à Jour

## Statut : DÉSACTIVÉS TEMPORAIREMENT

Les tests E2E ont été désactivés en décembre 2024 pendant la phase de développement MVP car ils n'étaient plus à jour avec les évolutions de l'application.

## Raisons de la désactivation

- Refonte de la page "Produits vendus"
- Nouveau système de permissions par module
- Nouveau système de notifications
- Changements dans les politiques RLS Supabase
- Évolution rapide de l'application en phase MVP

## À faire avant réactivation

- [ ] Mettre à jour les sélecteurs (data-testid)
- [ ] Revoir les parcours utilisateur
- [ ] Ajouter les tests pour le système de permissions
- [ ] Ajouter les tests pour le Mode Livreur
- [ ] Ajouter les tests pour les notifications
- [ ] Vérifier la configuration Supabase de test
- [ ] Mettre à jour les fixtures de test
- [ ] Vérifier les tests d'authentification
- [ ] Tester le workflow complet de commande

## Tests critiques à prioriser

1. **Authentification** (login/logout)
2. **Création de commande** (client)
3. **Acceptation de commande** (fournisseur)
4. **Workflow de livraison complet**
5. **Gestion des permissions** (propriétaire/gérant/membre)
6. **Interface administrateur**
7. **Système de notifications temps réel**

## Structure actuelle des tests

Les tests E2E se trouvent dans le dossier `/e2e/` et utilisent Playwright :

- `e2e/auth/` - Tests d'authentification
- `e2e/landing/` - Tests de la page d'accueil
- `e2e/legal/` - Tests des pages légales
- `e2e/pwa/` - Tests de la Progressive Web App

## Comment réactiver

1. Mettre à jour les tests dans `/e2e/`
2. Retirer la ligne `if: false` dans `.github/workflows/e2e-tests.yml`
3. Vérifier que tous les tests passent localement avec `npx playwright test`
4. Exécuter les tests dans différents navigateurs (Chrome, Firefox, Mobile)
5. Merger la PR de réactivation

## Commandes utiles

```bash
# Installer Playwright
npx playwright install --with-deps

# Lancer tous les tests E2E
npx playwright test

# Lancer les tests en mode UI
npx playwright test --ui

# Lancer un test spécifique
npx playwright test e2e/auth/auth.spec.ts

# Générer un rapport
npx playwright show-report
```

## Documentation

- Configuration Playwright : `/playwright.config.ts`
- Workflow GitHub Actions : `.github/workflows/e2e-tests.yml`
- Guide de test complet : `/GUIDE_TEST_COMPLET_E2E.md`

---

**⚠️ IMPORTANT** : Cette désactivation est temporaire et les tests DOIVENT être réactivés et mis à jour avant toute mise en production.
