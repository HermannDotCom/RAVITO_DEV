# Correction : Synchronisation des Données Admin

## Problème Initial

L'administrateur ne voyait pas les données complètes (photo de devanture et adresse géolocalisée) dans le panel d'examen des demandes d'approbation, même après que l'utilisateur les ait correctement sauvegardées.

## Cause Identifiée

1. **Mapping incomplet** : Les nouveaux champs `storefront_image_url`, `delivery_latitude` et `delivery_longitude` n'étaient pas mappés lors du chargement des utilisateurs en attente
2. **Conversion de type** : Les coordonnées GPS (type `numeric` en base) n'étaient pas converties en nombres JavaScript
3. **Absence de rafraîchissement manuel** : Aucun moyen pour l'admin de recharger les données à jour

## Solutions Appliquées

### 1. Mapping des Champs Complets

**Fichier** : `src/components/Admin/UserManagement.tsx:82-96`

Ajout des champs manquants dans le mapping :
```typescript
storefront_image_url: profile.storefront_image_url,
delivery_latitude: profile.delivery_latitude ? Number(profile.delivery_latitude) : undefined,
delivery_longitude: profile.delivery_longitude ? Number(profile.delivery_longitude) : undefined
```

### 2. Conversion Numérique des Coordonnées

Les coordonnées GPS sont maintenant explicitement converties en nombres avec `Number()`, car PostgreSQL `numeric` peut être reçu comme chaîne en JavaScript.

### 3. Logs de Débogage

Ajout de logs détaillés pour tracer les données :
- `UserManagement.tsx:80` - Données brutes reçues de la RPC
- `UserManagement.tsx:97-103` - Données mappées par utilisateur
- `UserExaminationModal.tsx:43-53` - Données reçues par le modal

### 4. Bouton de Rafraîchissement Manuel

**Fichier** : `src/components/Admin/UserManagement.tsx:406-414`

Ajout d'un bouton "Actualiser" avec :
- Icône `RefreshCw` qui tourne pendant le chargement
- Bouton désactivé pendant le chargement
- Texte masqué sur mobile (responsive)

## Modifications de l'Interface

### Interface `PendingUser` Étendue

**Fichier** : `src/components/Admin/UserManagement.tsx:8-21`

```typescript
interface PendingUser {
  // ... champs existants
  storefront_image_url?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}
```

**Fichier** : `src/components/Admin/UserExaminationModal.tsx:6-19`

Même structure pour le modal d'examen.

## Flux de Données Corrigé

### 1. Utilisateur complète son profil
- Sauvegarde adresse + photo via `ClientProfile.tsx`
- Données stockées dans `profiles` table

### 2. Trigger de notification
- `notify_admin_profile_completed()` notifie les super admins
- Notification visible dans le panel admin

### 3. Admin consulte la demande
- Clic sur "Actualiser" pour charger les dernières données
- RPC `get_users_by_status_with_email` retourne :
  - `storefront_image_url`
  - `delivery_latitude`
  - `delivery_longitude`

### 4. Affichage dans UserExaminationModal
- **Photo de la devanture** : Affichée si présente, sinon indicateur "En attente"
- **Carte GPS** : iframe OpenStreetMap avec marqueur si coordonnées présentes
- **Coordonnées** : Affichage précis latitude/longitude (6 décimales)

## Tests de Validation

### Test 1 : Vérification des données en base
```sql
SELECT
  name,
  storefront_image_url IS NOT NULL as has_photo,
  delivery_latitude IS NOT NULL as has_coords
FROM profiles
WHERE approval_status = 'pending';
```

### Test 2 : Console logs côté admin
Lors du clic sur "Actualiser", vérifier dans la console :
```
Pending users raw data: [...]
Mapped user Tata Mousso: {
  has_photo: true,
  has_lat: true,
  has_lng: true,
  photo_url: "https://...",
  coords: "5.28271674, -3.96683548"
}
```

### Test 3 : Modal d'examen
Lors de l'ouverture du modal, vérifier :
```
UserExaminationModal - User data received: {
  name: "Tata Mousso",
  has_storefront_image: true,
  has_coordinates: true,
  latitude: 5.28271674,
  longitude: -3.96683548
}
```

## Instructions pour l'Admin

1. **Après connexion d'un utilisateur qui complète son profil** :
   - Cliquer sur le bouton "Actualiser" (icône de rafraîchissement)
   - Attendre que l'icône arrête de tourner

2. **Examiner la demande** :
   - Cliquer sur "Examiner" pour l'utilisateur
   - Vérifier la section "Photo de la devanture" (image visible)
   - Vérifier la section "Localisation de l'établissement" (carte + coordonnées)

3. **Si les données ne s'affichent toujours pas** :
   - Ouvrir la console du navigateur (F12)
   - Vérifier les logs de débogage
   - Chercher des erreurs réseau ou RPC

## Fichiers Modifiés

- ✅ `src/components/Admin/UserManagement.tsx` - Mapping + bouton refresh
- ✅ `src/components/Admin/UserExaminationModal.tsx` - Logs + affichage
- ✅ `src/components/Client/ClientProfile.tsx` - Alerte de complétion (déjà fait)
- ✅ `src/hooks/useAllowedPages.ts` - Permissions sidebar (déjà fait)

## Migrations Déjà Appliquées

- ✅ `20260209034500_fix_organization_owners_as_members` - Membres manquants
- ✅ `20260209040000_add_profile_completion_notification` - Notification auto
- ✅ `20260209041000_update_get_users_with_location_and_image` - RPC étendue

## Résultat Final

✅ L'admin voit maintenant les données complètes lors de l'examen :
- Photo de la devanture (si fournie)
- Carte interactive avec localisation GPS (si fournie)
- Coordonnées précises affichées

✅ Bouton "Actualiser" permet de charger les dernières données à tout moment

✅ Logs de débogage facilitent le diagnostic de tout problème futur
