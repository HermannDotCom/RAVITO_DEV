# ✅ Checklist MEP RAVITO Gestion

**Date MEP prévue :** 14 février 2026  
**Version :** v1.6.3  
**Branche :** `RAVITO_Gestion`

---

## 1. 🔧 Technique

- [ ] `npm run build` passe sans erreur
- [ ] Aucune erreur TypeScript
- [ ] ESLint sans erreurs bloquantes
- [ ] Variables d'environnement production configurées
- [ ] Supabase secrets configurés (RESEND_API_KEY)
- [ ] Edge Functions déployées (`send-email`, `send-notification`)
- [ ] DNS/SSL configuré pour ravito.ci

---

## 2. 🗄️ Base de Données

- [ ] Backup Supabase effectué avant MEP
- [ ] Toutes les migrations appliquées
- [ ] RLS policies vérifiées et actives
- [ ] Realtime activé sur tables nécessaires :
  - [ ] `subscription_payments`
  - [ ] `support_tickets`
  - [ ] `notifications`

---

## 3. 📧 Communications

- [ ] Templates email testés (Resend)
- [ ] Email de bienvenue fonctionnel
- [ ] Domaine expéditeur vérifié (`@ravito.ci` ou `onboarding@resend.dev`)

---

## 4. 🧪 Tests Fonctionnels

### Parcours Client

- [ ] **Inscription** : Créer compte → Recevoir email bienvenue
- [ ] **Connexion** : Se connecter → Redirection vers Gestion Activité
- [ ] **Période d'essai** : 30 jours activés automatiquement
- [ ] **Gestion Activité** :
  - [ ] Créer feuille du jour
  - [ ] Ajouter lignes de stock
  - [ ] Ajouter dépenses
  - [ ] Clôturer la journée
  - [ ] Report automatique J+1
- [ ] **Abonnement** :
  - [ ] Voir les plans disponibles
  - [ ] Sélectionner un plan
  - [ ] Soumettre un paiement
- [ ] **Équipe** :
  - [ ] Inviter un membre
  - [ ] Définir les permissions
- [ ] **Support** : Créer un ticket
- [ ] **Profil** : Modifier les informations

### Parcours Admin

- [ ] **Validation paiement** : Notification → Valider → Génération reçu PDF
- [ ] **Gestion utilisateurs** : Voir, approuver, suspendre
- [ ] **Gestion abonnements** : Liste, détails, historique
- [ ] **Support tickets** : Répondre aux tickets

### Parcours Fournisseur

- [ ] **Connexion** : Redirection vers Profil
- [ ] **Équipe** : Gérer les membres
- [ ] **Support** : Créer un ticket

---

## 5. 📱 Responsive & PWA

- [ ] Mobile (iPhone Safari, Android Chrome)
- [ ] Tablette
- [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Installation PWA fonctionne
- [ ] Icône et splash screen corrects

---

## 6. 🔒 Sécurité

- [ ] HTTPS actif et forcé
- [ ] Pas de données sensibles dans le code source
- [ ] Pas de clés API exposées côté client
- [ ] Content Security Policy configurée

---

## 7. 📊 Monitoring

- [ ] **Sentry** configuré avec DSN production
- [ ] **Logs Supabase** accessibles
- [ ] **Alertes** configurées pour erreurs critiques

---

## 8. 📄 Documentation

- [ ] README à jour
- [ ] Guide de déploiement prêt
- [ ] Plan de rollback documenté
- [ ] Contacts d'urgence listés

---

## ✅ Validation Finale

| Validateur | Date | Signature |
|------------|------|-----------|
| Hermann (Lead Dev) | ___/02/2026 | __________ |

---

**Note :** Ne pas déployer si une case critique n'est pas cochée.
