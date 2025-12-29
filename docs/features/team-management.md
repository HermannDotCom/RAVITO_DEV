# 👥 Système de Gestion d'Équipe

Un système complet de gestion d'organisations multi-utilisateurs et de permissions pour RAVITO.

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux Clients, Fournisseurs et Admins de créer des organisations et d'inviter des membres d'équipe avec des rôles et permissions spécifiques, permettant un travail collaboratif tout en maintenant un contrôle d'accès approprié.

## ✨ Fonctionnalités Clés

- **Organisations Multi-utilisateurs** - Créez des équipes avec plusieurs membres
- **Permissions par Rôle** - 9 rôles prédéfinis avec des droits d'accès spécifiques
- **Gestion des Quotas** - Limites de membres appliquées (Client: 2, Fournisseur: 2, Admin: 5)
- **Invitations de Membres** - Système d'invitation par email avec tokens uniques
- **Permission Gates** - Rendu conditionnel de l'UI basé sur les permissions
- **Sécurité d'Abord** - Politiques RLS, validation côté serveur, zéro vulnérabilité

---

## 🚀 Démarrage Rapide

### 1. Appliquer la Migration de Base de Données

```bash
# La migration est située à :
supabase/migrations/20251207222525_create_team_management_system.sql

# Appliquez-la à votre projet Supabase
supabase db push
```

### 2. Créer une Organisation

```sql
-- Créer une organisation pour un utilisateur
SELECT create_organization_with_owner(
  'Ma Société',           -- Nom de l'organisation
  'client',              -- Type: 'client', 'supplier', ou 'admin'
  'user-uuid-here',      -- ID utilisateur (propriétaire)
  'owner@company.com'    -- Email du propriétaire
);
```

### 3. Accéder à la Page Équipe

1. Connectez-vous à l'application
2. Cliquez sur "Mon Équipe" dans la barre latérale
3. Commencez à inviter des membres !

---

## 👥 Rôles Disponibles

### Rôles Client

- **Propriétaire** - Accès complet à toutes les fonctionnalités
- **Manager** - Gère le catalogue et les commandes
- **Employé** - Crée des commandes, accès limité

### Rôles Fournisseur

- **Propriétaire** - Accès complet à toutes les fonctionnalités
- **Gestionnaire** - Gère les commandes et les livraisons
- **Livreur** - Gère uniquement les livraisons

### Rôles Admin

- **Super Admin** - Accès complet à la plateforme
- **Administrateur** - Gestion des opérations quotidiennes
- **Support** - Assistance utilisateurs et tickets

---

## 🔐 Permissions

Chaque rôle possède des permissions spécifiques dans différentes sections :

- **catalog** - Voir, créer, modifier, supprimer des produits
- **orders** - Voir, créer, modifier, supprimer des commandes
- **treasury** - Voir, gérer les finances
- **team** - Voir, inviter, retirer, modifier des membres
- **settings** - Voir, modifier les paramètres système
- **zones** - Voir, créer, modifier, supprimer des zones de livraison
- **deliveries** - Voir, gérer les livraisons
- **analytics** - Voir les rapports et statistiques
- **users** - Voir, créer, modifier, supprimer des utilisateurs
- **products** - Voir, créer, modifier, supprimer des produits
- **support** - Voir, gérer les tickets

---

## 💻 Utilisation

### Accéder à la Page Équipe

1. Connectez-vous à votre compte
2. Cliquez sur "Mon Équipe" dans la barre latérale
3. Visualisez les membres de votre organisation

### Inviter un Membre

1. Cliquez sur le bouton "Inviter"
2. Entrez l'adresse email du membre
3. Sélectionnez son rôle dans la liste déroulante
4. Cliquez sur "Inviter" pour envoyer l'invitation

**Note** : Le système vérifie le quota avant d'autoriser les invitations. Si vous avez atteint votre limite, le bouton d'invitation sera désactivé.

### Gérer les Membres

- **Modifier le Rôle** : Cliquez sur le menu (⋮) sur une carte de membre et sélectionnez "Modifier le rôle"
- **Retirer un Membre** : Cliquez sur le menu (⋮) et sélectionnez "Retirer du groupe"

**Note** : Vous ne pouvez pas modifier ou retirer le propriétaire de l'organisation.

---

## 🧩 Utilisation dans le Code

### Hook useTeam

```tsx
import { useTeam } from '../hooks/useTeam';

function TeamComponent() {
  const { 
    organization, 
    members, 
    stats,
    isLoading,
    inviteMember,
    removeMember,
    updateMemberRole
  } = useTeam();

  const handleInvite = async () => {
    const success = await inviteMember('user@example.com', 'manager');
    if (success) {
      console.log('Membre invité avec succès');
    }
  };

  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>{stats?.activeMembers} / {stats?.maxMembers} membres</p>
    </div>
  );
}
```

### Permission Gate

```tsx
import { PermissionGate } from '../components/Team';

function ProtectedContent() {
  return (
    <PermissionGate 
      section="treasury" 
      action="view"
      organizationId={org?.id}
    >
      <TreasuryDashboard />
    </PermissionGate>
  );
}
```

### Hook usePermissions

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, permissions, isLoading } = usePermissions(organizationId);

  if (can('team', 'invite')) {
    return <InviteButton />;
  }

  return <div>Vous n'avez pas la permission d'inviter des membres</div>;
}
```

---

## 📁 Structure des Fichiers

```
src/
├── components/Team/
│   ├── TeamPage.tsx           # Page principale de gestion d'équipe
│   ├── InviteMemberModal.tsx  # Modal d'invitation de membre
│   ├── MemberCard.tsx         # Carte d'affichage de membre
│   ├── QuotaBar.tsx           # Visualisation du quota
│   ├── RoleSelector.tsx       # Sélecteur de rôle
│   ├── PermissionGate.tsx     # Rendu basé sur les permissions
│   └── index.ts               # Exports
├── hooks/
│   ├── useTeam.ts             # Hook de gestion d'équipe
│   └── usePermissions.ts      # Hook de vérification de permissions
├── services/
│   ├── teamService.ts         # Opérations CRUD d'équipe
│   └── permissionService.ts   # Requêtes de permissions
├── types/
│   └── team.ts                # Définitions TypeScript
└── utils/
    └── validation.ts          # Validation des entrées

supabase/migrations/
└── 20251207222525_create_team_management_system.sql
```

---

## 📚 API Reference

### TeamService

```typescript
// Obtenir l'organisation d'un utilisateur
getOrganization(userId: string): Promise<Organization | null>

// Obtenir les membres d'une organisation
getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>

// Inviter un membre
inviteMember(orgId: string, email: string, role: MemberRole): Promise<Result>

// Retirer un membre
removeMember(memberId: string): Promise<Result>

// Mettre à jour le rôle d'un membre
updateMemberRole(memberId: string, newRole: MemberRole): Promise<Result>

// Accepter une invitation
acceptInvitation(token: string, userId: string): Promise<Result>

// Obtenir les statistiques d'équipe
getTeamStats(orgId: string): Promise<TeamStats>
```

### PermissionService

```typescript
// Obtenir les permissions d'un utilisateur
getUserPermissions(userId: string, orgId: string): Promise<Permissions>

// Vérifier une permission spécifique
hasPermission(userId: string, orgId: string, section: string, action: PermissionAction): Promise<boolean>

// Obtenir les permissions d'un rôle
getRolePermissions(orgType: OrganizationType, role: MemberRole): Promise<RolePermission | null>

// Obtenir les rôles disponibles
getAvailableRoles(orgType: OrganizationType): Promise<RolePermission[]>
```

---

## 🧪 Tests

Exécuter les tests de validation :

```bash
npm test -- src/utils/__tests__/validation.test.ts
```

Résultat attendu :
```
✓ Validation Utilities (10 tests)
  ✓ isValidEmail (4 tests)
  ✓ isValidPhone (3 tests)
  ✓ isValidUrl (3 tests)
```

### Checklist de Tests

- [ ] Créer une organisation pour chaque type d'utilisateur (client, fournisseur, admin)
- [ ] Inviter des membres avec différents rôles
- [ ] Vérifier l'application du quota (essayer d'inviter plus que permis)
- [ ] Tester les mises à jour de rôles
- [ ] Tester le retrait de membres
- [ ] Vérifier que les permission gates fonctionnent correctement
- [ ] Tester avec plusieurs organisations
- [ ] Vérifier que les politiques RLS empêchent l'accès non autorisé

---

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Accès aux données limité par organisation
- ✅ Validation des permissions côté serveur
- ✅ Prévention des injections SQL
- ✅ Protection du propriétaire (ne peut pas être retiré/rétrogradé)
- ✅ Scan CodeQL : 0 vulnérabilité

### Considérations de Sécurité

1. **Row Level Security (RLS)** : Toutes les tables ont RLS activé avec des politiques qui appliquent les limites d'organisation
2. **Vérification des Permissions** : Toujours vérifier les permissions côté client ET serveur
3. **Protection du Propriétaire** : Les propriétaires ne peuvent pas être retirés ou voir leur rôle changé
4. **Application du Quota** : La fonction côté serveur assure le respect des limites de quota

---

## ❓ Dépannage

### Problème : "Quota atteint" lors de l'invitation de membres

**Solution** : Vous avez atteint la limite de membres de votre organisation. Contactez le support pour augmenter votre quota.

### Problème : Impossible de voir l'élément de menu équipe

**Solution** : Assurez-vous d'être connecté et que la migration a été appliquée à la base de données.

### Problème : Erreurs de permission refusée

**Solution** : Vérifiez que les politiques RLS sont activées et que l'utilisateur est correctement associé à une organisation.

### Problème : Les emails d'invitation ne sont pas envoyés

**Note** : L'envoi d'emails nécessite une configuration supplémentaire avec les Edge Functions de Supabase ou un service d'email externe. Le token d'invitation est stocké dans la base de données pour une acceptation manuelle ou une implémentation future.

---

## 🚀 Améliorations Futures

Améliorations potentielles pour post-MVP :

1. **Intégration Email** : Implémenter les emails d'invitation automatisés via Edge Functions Supabase
2. **Rôles Personnalisés** : Permettre aux organisations de créer des rôles personnalisés avec des permissions spécifiques
3. **Journal d'Activité** : Suivre les actions des membres à des fins d'audit
4. **Augmentation de Quota** : Permettre aux organisations d'acheter des emplacements de membres supplémentaires
5. **Profils de Membres** : Informations et avatars de membres améliorés
6. **Authentification à Deux Facteurs** : Sécurité supplémentaire pour les membres d'équipe
7. **Invitations en Masse** : Inviter plusieurs membres à la fois via upload CSV

---

## 📞 Support

Pour des questions ou des problèmes avec le système de gestion d'équipe, veuillez contacter le support via l'élément de menu "Nous contacter" dans l'application ou par email : support@ravito.ci
