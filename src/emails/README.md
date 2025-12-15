# Email Templates RAVITO

Templates d'emails transactionnels pour RAVITO, cohérents avec le design system (orange #F97316, design moderne, textes en français).

## 📁 Structure

```
src/emails/
├── index.ts                                    # Export principal
└── templates/
    ├── index.ts                                # Exports des templates
    ├── BaseEmailTemplate.tsx                   # Template de base réutilisable
    ├── WelcomeEmail.tsx                        # Email de bienvenue
    ├── PasswordResetEmail.tsx                  # Réinitialisation de mot de passe
    ├── NewOrderEmail.tsx                       # Notification nouvelle commande
    └── DeliveryConfirmationEmail.tsx           # Confirmation de livraison
```

## 🎨 Design System

| Élément | Valeur |
|---------|--------|
| Couleur principale | #F97316 (orange RAVITO) |
| Couleur succès | #10B981 (vert) |
| Couleur warning | #F59E0B (amber) |
| Texte principal | #111827 (gris foncé) |
| Texte secondaire | #4B5563 (gris moyen) |
| Background page | #F4F4F5 |
| Background card | #FFFFFF |
| Border radius | 12px (cards), 8px (buttons) |
| Font titres | Plus Jakarta Sans |
| Font body | Inter |
| Largeur max | 600px |

## 📧 Templates Disponibles

### 1. BaseEmailTemplate

Template de base avec header orange, logo RAVITO, et footer avec slogan.

```tsx
import { BaseEmailTemplate } from '@/emails';

<BaseEmailTemplate recipientEmail="user@example.com">
  {/* Contenu de votre email */}
</BaseEmailTemplate>
```

### 2. WelcomeEmail

Email de bienvenue après inscription, personnalisé selon le rôle (client/fournisseur).

```tsx
import { WelcomeEmail, welcomeEmailSubject, welcomeEmailPreview } from '@/emails';

const subject = welcomeEmailSubject('Jean Dupont');
const preview = welcomeEmailPreview('Restaurant Le Soleil');

<WelcomeEmail
  userName="Jean"
  userEmail="jean@example.com"
  role="client"
  businessName="Restaurant Le Soleil"
  dashboardUrl="https://ravito.ci/dashboard"
/>
```

**Sujet** : "Bienvenue sur RAVITO, Jean Dupont ! 🎉"

**Fonctionnalités incluses** :
- Message personnalisé selon le rôle
- Récapitulatif du compte créé
- Bouton CTA vers le dashboard
- Liste des fonctionnalités disponibles

### 3. PasswordResetEmail

Email de réinitialisation de mot de passe avec lien sécurisé et expiration.

```tsx
import { PasswordResetEmail, passwordResetSubject, passwordResetPreview } from '@/emails';

const subject = passwordResetSubject();
const preview = passwordResetPreview();

<PasswordResetEmail
  userName="Jean"
  userEmail="jean@example.com"
  resetUrl="https://ravito.ci/reset-password?token=abc123"
  expirationMinutes={30}
/>
```

**Sujet** : "Réinitialisation de votre mot de passe RAVITO"

**Fonctionnalités incluses** :
- Bouton CTA vers le lien de réinitialisation
- Encadré warning avec expiration
- Lien alternatif pour copier/coller
- Note de sécurité

### 4. NewOrderEmail

Email de notification nouvelle commande (envoyé au fournisseur).

```tsx
import { NewOrderEmail, newOrderSubject, newOrderPreview } from '@/emails';

const subject = newOrderSubject('ORD-2024-001', 'Cocody');
const preview = newOrderPreview('Restaurant Le Soleil', 125000);

<NewOrderEmail
  supplierName="Fournisseur ABC"
  supplierEmail="supplier@example.com"
  orderId="ORD-2024-001"
  clientName="Restaurant Le Soleil"
  clientAddress="Rue 12, Cocody"
  clientZone="Cocody"
  items={[
    { name: 'Riz parfumé', quantity: 25, unit: 'kg' },
    { name: 'Huile végétale', quantity: 10, unit: 'L' },
    { name: 'Tomates', quantity: 15, unit: 'kg' },
  ]}
  totalAmount={125000}
  dashboardUrl="https://ravito.ci/supplier/orders/ORD-2024-001"
/>
```

**Sujet** : "🔔 Nouvelle commande #ORD-2024-001 - Cocody"

**Fonctionnalités incluses** :
- Card récapitulatif de la commande
- Informations client et adresse
- Liste détaillée des articles
- Montant estimé en gros
- Message d'urgence pour réponse rapide

### 5. DeliveryConfirmationEmail

Email de confirmation de livraison (envoyé au client).

```tsx
import { 
  DeliveryConfirmationEmail, 
  deliveryConfirmationSubject, 
  deliveryConfirmationPreview 
} from '@/emails';

const subject = deliveryConfirmationSubject('ORD-2024-001');
const preview = deliveryConfirmationPreview('Fournisseur ABC');

<DeliveryConfirmationEmail
  clientName="Jean"
  clientEmail="jean@example.com"
  orderId="ORD-2024-001"
  supplierName="Fournisseur ABC"
  deliveryTime="Aujourd'hui à 14h30"
  totalAmount={125000}
  ratingUrl="https://ravito.ci/orders/ORD-2024-001/rate"
/>
```

**Sujet** : "✅ Livraison effectuée - Commande #ORD-2024-001"

**Fonctionnalités incluses** :
- Icône succès (cercle vert avec ✓)
- Card récapitulatif de la livraison
- Section évaluation avec étoiles
- Message de remerciement

## 🔄 Utilisation dans le Backend

### Exemple avec un service d'envoi d'emails

```typescript
import { renderToString } from 'react-dom/server';
import { 
  WelcomeEmail, 
  welcomeEmailSubject, 
  welcomeEmailPreview 
} from '@/emails';

async function sendWelcomeEmail(user: User) {
  const subject = welcomeEmailSubject(user.name);
  const preview = welcomeEmailPreview(user.businessName);
  
  const html = renderToString(
    <WelcomeEmail
      userName={user.firstName}
      userEmail={user.email}
      role={user.role}
      businessName={user.businessName}
      dashboardUrl={`${process.env.APP_URL}/dashboard`}
    />
  );

  await emailService.send({
    to: user.email,
    subject,
    html,
    previewText: preview,
  });
}
```

### Exemple avec Supabase Edge Functions

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import React from 'https://esm.sh/react@18.2.0';
import { renderToString } from 'https://esm.sh/react-dom@18.2.0/server';
import { NewOrderEmail, newOrderSubject } from '../_shared/emails/index.ts';

serve(async (req) => {
  const { orderId, supplierEmail, orderData } = await req.json();
  
  const subject = newOrderSubject(orderId, orderData.clientZone);
  const html = renderToString(
    React.createElement(NewOrderEmail, {
      ...orderData,
      orderId,
      supplierEmail,
    })
  );

  // Envoyer l'email via Resend, SendGrid, etc.
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RAVITO <notifications@ravito.ci>',
      to: [supplierEmail],
      subject,
      html,
    }),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 📱 Compatibilité

Les templates sont optimisés pour :
- **Desktop** : Outlook, Thunderbird, Apple Mail
- **Webmail** : Gmail, Yahoo, Outlook.com
- **Mobile** : iOS Mail, Gmail app, Samsung Mail

### Responsive Design
- Breakpoint mobile : 600px
- Paddings réduits sur mobile
- Boutons en pleine largeur
- Texte adaptatif

## 🎯 Bonnes Pratiques

1. **Toujours utiliser les fonctions subject et preview** pour cohérence
2. **Tester sur plusieurs clients email** avant déploiement
3. **Personnaliser les URLs** selon l'environnement (dev/prod)
4. **Inclure des liens de fallback** pour les boutons
5. **Respecter les styles inline** pour compatibilité email

## 🔧 Maintenance

### Ajouter un nouveau template

1. Créer le fichier dans `src/emails/templates/NouveauTemplate.tsx`
2. Utiliser `BaseEmailTemplate` comme wrapper
3. Exporter le composant + fonctions subject/preview
4. Ajouter les exports dans `src/emails/templates/index.ts`

### Modifier le design global

Éditer `BaseEmailTemplate.tsx` pour :
- Header/footer
- Couleurs globales
- Typographie
- Styles responsive

## 📞 Support

Pour toute question ou problème, contactez l'équipe technique RAVITO.
