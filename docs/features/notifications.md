# Système de Notifications RAVITO

Ce document décrit le système de notifications complet implémenté dans RAVITO.

## Vue d'ensemble

Le système de notifications permet d'alerter les utilisateurs des événements importants via plusieurs canaux :
- 🔔 **Notifications Push Web** - Notifications en temps réel via le navigateur
- 📧 **Notifications Email** - Emails pour les événements importants
- 📱 **Notifications SMS** - SMS pour les urgences (à venir)

## Architecture

### Base de Données

#### Table `notification_preferences`
Stocke les préférences de notification de chaque utilisateur.

```sql
- push_enabled: boolean (notifications push activées)
- email_enabled: boolean (notifications email activées)
- sms_enabled: boolean (notifications SMS activées)
- notify_new_order: boolean (nouvelles commandes)
- notify_order_status: boolean (statut des commandes)
- notify_delivery_assigned: boolean (livraison assignée)
- notify_delivery_status: boolean (statut de livraison)
- notify_payment: boolean (paiements)
- notify_team: boolean (équipe)
- notify_support: boolean (support)
- notify_promotions: boolean (promotions)
```

**Caractéristiques:**
- Création automatique lors de l'inscription d'un utilisateur
- RLS activé pour sécurité
- Index sur `user_id` pour performance

#### Table `push_subscriptions`
Stocke les endpoints de push notification pour chaque appareil.

```sql
- endpoint: text (URL de l'endpoint push)
- p256dh_key: text (clé publique pour encryption)
- auth_key: text (clé d'authentification)
- device_name: text (nom de l'appareil)
- last_used_at: timestamp (dernière utilisation)
```

**Caractéristiques:**
- Unique par (user_id, endpoint)
- RLS activé pour sécurité
- Auto-nettoyage des subscriptions expirées possible

### Service Worker (`public/sw.js`)

Le Service Worker gère les notifications push en arrière-plan :

```javascript
// Événement push - affiche la notification
self.addEventListener('push', function(event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, options);
});

// Clic sur notification - navigue vers l'URL
self.addEventListener('notificationclick', function(event) {
  clients.openWindow(data.url);
});
```

### Hook React: `usePushNotifications`

Hook personnalisé pour gérer les abonnements push.

```typescript
const {
  isSupported,      // Push notifications supportées ?
  permission,       // Statut de permission
  isSubscribed,     // Utilisateur abonné ?
  subscribe,        // S'abonner aux notifications
  unsubscribe,      // Se désabonner
  error             // Erreur éventuelle
} = usePushNotifications();
```

**Fonctionnalités:**
- Détection automatique du support
- Gestion des permissions
- Conversion VAPID key (base64 → Uint8Array)
- Sauvegarde automatique en base de données

### Service: `notificationService`

Service central pour gérer toutes les opérations de notification.

```typescript
export const notificationService = {
  // Notifications
  getNotifications(userId, limit),
  getUnreadCount(userId),
  markAsRead(notificationId),
  markAllAsRead(userId),
  deleteNotification(notificationId),
  
  // Préférences
  getPreferences(userId),
  updatePreferences(userId, prefs),
  
  // Push subscriptions
  subscribeToPush(userId, subscription),
  unsubscribeFromPush(userId, endpoint),
  getPushSubscriptions(userId)
};
```

### Composants UI

#### `NotificationPreferences.tsx`
Composant pour gérer les préférences utilisateur.

**Fonctionnalités:**
- Toggle pour chaque canal (push, email, SMS)
- Toggle pour chaque type de notification
- Sauvegarde automatique
- Support des notifications push avec gestion des permissions
- Messages de feedback

#### `NotificationsPage.tsx`
Page complète de gestion des notifications.

**Fonctionnalités:**
- Onglets: Notifications / Préférences
- Filtres: Toutes / Non lues / Par type
- Actions: Marquer comme lu, Supprimer
- Compteur de notifications non lues
- Formatage des dates relatif

#### `NotificationPanel.tsx` (existant)
Panel dropdown accessible depuis le header.

**Fonctionnalités:**
- Liste des notifications récentes
- Badge compteur dans le header
- Actions rapides (marquer lu, supprimer)
- Filtres: Toutes / Non lues

### Edge Functions

#### `send-notification` (Supabase)
Fonction serverless pour envoyer des notifications multi-canal.

```typescript
POST /functions/v1/send-notification
{
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: object,
  channels?: {
    push?: boolean,
    email?: boolean,
    sms?: boolean
  }
}
```

**Logique:**
1. Récupère les préférences utilisateur
2. Vérifie si le type de notification est activé
3. Enregistre dans la table `notifications`
4. Envoie via les canaux activés (push, email, SMS)

#### Templates Email (`supabase/functions/_templates/`)

Templates HTML disponibles :
- `new-order.html` - Nouvelle commande pour fournisseur
- `order-accepted.html` - Commande acceptée pour client
- `delivery-completed.html` - Livraison terminée pour client

**Variables supportées:**
- `{{userName}}`, `{{orderNumber}}`, `{{supplierName}}`
- `{{clientName}}`, `{{totalAmount}}`, `{{zoneName}}`
- `{{deliveryTime}}`, `{{ratingUrl}}`, `{{dashboardUrl}}`

## Configuration

### Variables d'environnement

```bash
# VAPID Keys pour Push Notifications (Web Push)
VITE_VAPID_PUBLIC_KEY=your-public-vapid-key

# Configuration Email (Supabase Edge Functions)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@ravito.ci

# Configuration SMS (à venir)
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
```

### Génération des clés VAPID

```bash
# Installer web-push
npm install -g web-push

# Générer les clés
web-push generate-vapid-keys

# Sortie:
# Public Key: BG8qx...
# Private Key: Sf3k...
```

**Important:** Stockez la clé privée dans les secrets Supabase et la publique dans `.env`

## Utilisation

### 1. Activer les notifications push (utilisateur)

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { subscribe, isSubscribed } = usePushNotifications();
  
  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      console.log('Notifications activées !');
    }
  };
  
  return (
    <button onClick={handleEnable}>
      {isSubscribed ? 'Désactiver' : 'Activer'} les notifications
    </button>
  );
}
```

### 2. Envoyer une notification (backend)

```typescript
// Via le service
import { createNotification } from '@/services/notificationService';

await createNotification({
  userId: 'user-123',
  type: 'new_order',
  title: 'Nouvelle commande !',
  message: 'Vous avez reçu une nouvelle commande #12345',
  data: { orderNumber: '12345', amount: 50000 }
});
```

```typescript
// Via Edge Function (pour notifications multi-canal)
const response = await fetch('/functions/v1/send-notification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-123',
    type: 'new_order',
    title: 'Nouvelle commande !',
    body: 'Commande #12345 disponible',
    channels: { push: true, email: true }
  })
});
```

### 3. Écouter les notifications (realtime)

Les notifications sont automatiquement reçues via:
1. **Realtime Supabase** - Insertion dans la table `notifications`
2. **NotificationContext** - Écoute et affiche automatiquement
3. **Service Worker** - Affiche les notifications push même si l'app est fermée

## Types de notifications supportés

| Type | Description | Destinataire | Canaux |
|------|-------------|--------------|--------|
| `new_order` | Nouvelle commande disponible | Fournisseur | Push, Email |
| `order_accepted` | Commande acceptée | Client | Push, Email |
| `order_status` | Changement de statut | Client | Push |
| `delivery_assigned` | Livraison assignée | Livreur | Push, Email |
| `delivery_started` | Livraison en cours | Client | Push |
| `delivery_completed` | Livraison terminée | Client | Push, Email |
| `payment_received` | Paiement reçu | Fournisseur | Email |
| `account_approved` | Compte approuvé | Utilisateur | Email |
| `zone_approved` | Zone approuvée | Fournisseur | Push, Email |
| `team_invitation` | Invitation équipe | Membre | Email |
| `support_reply` | Réponse support | Utilisateur | Push, Email |

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS strictes :

```sql
-- Lecture: uniquement ses propres données
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Modification: uniquement ses propres données
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

### Validation

- **Frontend:** Validation TypeScript stricte
- **Backend:** Validation dans Edge Functions
- **Database:** Contraintes et triggers SQL

## Performance

### Optimisations implémentées

1. **Indexes** sur colonnes fréquemment interrogées
2. **Limite de résultats** (50 notifications par défaut)
3. **Pagination** pour grandes listes
4. **Cache côté client** via React Context
5. **Realtime** pour mises à jour instantanées sans polling

### Métriques cibles

- **Chargement initial:** < 200ms
- **Affichage notification:** < 50ms
- **Push notification:** < 2s après événement

## Tests

### Tests unitaires

```bash
# Exécuter les tests du service
npm test src/services/__tests__/notificationService.test.ts

# Tous les tests
npm test
```

**Couverture:**
- ✅ Récupération des préférences
- ✅ Mise à jour des préférences
- ✅ Compteur de notifications non lues
- ✅ Marquage comme lu
- ✅ Suppression
- ✅ Abonnement/Désabonnement push

### Tests manuels

1. **Navigation:**
   - Connexion utilisateur
   - Cliquer sur l'icône cloche dans le header
   - Naviguer vers `/notifications`

2. **Notifications Push:**
   - Activer dans les préférences
   - Autoriser dans le navigateur
   - Créer une notification test
   - Vérifier réception même si onglet fermé

3. **Filtres:**
   - Tester tous les filtres (toutes, non lues, par type)
   - Vérifier compteur

4. **Actions:**
   - Marquer comme lu (individuel et masse)
   - Supprimer
   - Vérifier mise à jour en temps réel

## Troubleshooting

### Push notifications ne fonctionnent pas

**Problème:** Clé VAPID non configurée
```
Solution: Configurer VITE_VAPID_PUBLIC_KEY dans .env
```

**Problème:** Permission refusée
```
Solution: Vérifier les paramètres du navigateur
Chrome: chrome://settings/content/notifications
Firefox: about:preferences#privacy
```

**Problème:** Service Worker non enregistré
```
Solution: Vérifier que sw.js est accessible à /sw.js
npm run build && npm run preview
```

### Notifications email ne s'envoient pas

**Problème:** Configuration SMTP/Resend manquante
```
Solution: Configurer les variables d'environnement Supabase
RESEND_API_KEY, EMAIL_FROM
```

**Problème:** Template non trouvé
```
Solution: Vérifier que les fichiers HTML sont dans
supabase/functions/_templates/
```

## Roadmap

### Phase 1 (Actuelle) ✅
- [x] Infrastructure base de données
- [x] Service Worker et push notifications
- [x] UI préférences et centre de notifications
- [x] Tests unitaires

### Phase 2 (À venir)
- [ ] Triggers automatiques (DB ou app)
- [ ] Envoi effectif d'emails
- [ ] Templates email complets
- [ ] Statistiques de notifications

### Phase 3 (Futur)
- [ ] Notifications SMS
- [ ] Notification groupées/digest
- [ ] Préférences avancées (horaires, fréquence)
- [ ] Support multilingue

## Support

Pour toute question ou problème:
- **Email:** support@ravito.ci
- **Documentation:** `/docs`
- **Issues GitHub:** [github.com/HermannDotCom/RAVITO/issues](https://github.com/HermannDotCom/RAVITO/issues)
