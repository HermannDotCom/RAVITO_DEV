# LocationPicker Component

Un composant React réutilisable pour la sélection interactive de localisation utilisant Leaflet et OpenStreetMap.

## 🎯 Objectif

Ce composant permet aux utilisateurs de définir visuellement leur adresse de livraison via une carte interactive. Il est utilisé dans :
- **Page "Mon Profil"** : Définir l'adresse de livraison par défaut
- **Page "Finaliser la commande"** : Modifier temporairement l'adresse pour une commande

## 📦 Stack Technique

| Élément | Technologie | Version |
|---------|------------|---------|
| **Carte** | Leaflet.js | ~1.9.x |
| **React Wrapper** | react-leaflet | 4.2.1 |
| **Tuiles** | OpenStreetMap | - |
| **Geocoding** | Nominatim (API OSM) | - |
| **GPS** | navigator.geolocation | HTML5 |

## 🚀 Installation

Les dépendances sont déjà installées dans le projet :

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@types/leaflet": "^1.9.8"
  }
}
```

## 📝 Utilisation

### Import

```typescript
import { LocationPicker } from '../components/Shared/LocationPicker';
```

### Exemple Basique

```tsx
import React, { useState } from 'react';
import { LocationPicker } from '../components/Shared/LocationPicker';

function MyComponent() {
  const handleLocationChange = (location) => {
    console.log('Nouvelle localisation:', location);
    // location = { latitude, longitude, address, instructions }
  };

  return (
    <LocationPicker
      onLocationChange={handleLocationChange}
      height="400px"
    />
  );
}
```

## 🔧 Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `initialLatitude` | `number \| null` | `null` | Latitude initiale |
| `initialLongitude` | `number \| null` | `null` | Longitude initiale |
| `initialAddress` | `string` | `''` | Adresse initiale |
| `initialInstructions` | `string` | `''` | Instructions initiales |
| `onLocationChange` | `function` | **Requis** | Callback appelé lors du changement de localisation |
| `readOnly` | `boolean` | `false` | Mode lecture seule |
| `showSearchBar` | `boolean` | `true` | Afficher la barre de recherche |
| `showGpsButton` | `boolean` | `true` | Afficher le bouton GPS |
| `showInstructions` | `boolean` | `true` | Afficher le champ instructions |
| `height` | `string` | `'400px'` | Hauteur de la carte |
| `defaultCenter` | `[number, number]` | `[5.3600, -4.0083]` | Centre par défaut (Abidjan) |
| `defaultZoom` | `number` | `13` | Zoom par défaut |

### Callback `onLocationChange`

Le callback reçoit un objet avec les propriétés suivantes :

```typescript
{
  latitude: number;      // Latitude sélectionnée
  longitude: number;     // Longitude sélectionnée
  address: string;       // Adresse formatée (via Nominatim)
  instructions: string;  // Instructions pour le livreur
}
```

## 📖 Exemples d'Utilisation

### 1. Page Profil - Adresse par Défaut

```tsx
import { LocationPicker } from '../components/Shared/LocationPicker';
import { DeliveryLocation } from '../types';

export const ProfileLocation = () => {
  const [location, setLocation] = useState<DeliveryLocation>({
    latitude: null,
    longitude: null,
    address: '',
    instructions: null
  });

  const handleLocationChange = (newLocation) => {
    setLocation({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      address: newLocation.address,
      instructions: newLocation.instructions || null
    });
    
    // Sauvegarder dans la base de données
    saveToProfile(newLocation);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Mon Adresse de Livraison</h2>
      
      <LocationPicker
        initialLatitude={location.latitude}
        initialLongitude={location.longitude}
        initialAddress={location.address}
        initialInstructions={location.instructions || ''}
        onLocationChange={handleLocationChange}
        showSearchBar={true}
        showGpsButton={true}
        showInstructions={true}
        height="400px"
      />
      
      <button 
        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
        onClick={() => saveLocation(location)}
      >
        Enregistrer l'adresse
      </button>
    </div>
  );
};
```

### 2. Checkout - Adresse Temporaire

```tsx
export const CheckoutLocation = () => {
  const [orderLocation, setOrderLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    instructions: ''
  });

  return (
    <div className="checkout-container">
      <h2>Adresse de Livraison</h2>
      
      <LocationPicker
        onLocationChange={setOrderLocation}
        showSearchBar={true}
        showGpsButton={true}
        showInstructions={true}
        height="350px"
      />
      
      <button onClick={() => proceedWithOrder(orderLocation)}>
        Continuer
      </button>
    </div>
  );
};
```

### 3. Mode Lecture Seule

```tsx
export const OrderLocationView = ({ order }) => {
  return (
    <div className="order-details">
      <h3>Adresse de Livraison</h3>
      
      <LocationPicker
        initialLatitude={order.delivery_latitude}
        initialLongitude={order.delivery_longitude}
        initialAddress={order.deliveryAddress}
        initialInstructions={order.delivery_instructions}
        onLocationChange={() => {}} // No-op
        readOnly={true}
        showSearchBar={false}
        showGpsButton={false}
        showInstructions={true}
        height="300px"
      />
    </div>
  );
};
```

## 🎨 Fonctionnalités

### 1. Carte Interactive
- Affichage OpenStreetMap centré sur Abidjan par défaut
- Marqueur draggable pour sélectionner la position
- Clic sur la carte pour déplacer le marqueur
- Zoom min/max approprié (10-18)

### 2. Barre de Recherche
- Input avec placeholder "Rechercher un lieu..."
- Debounce 500ms (respecte les limites de Nominatim)
- Affiche max 5 suggestions
- Clic sur suggestion → centre la carte + place le marqueur
- Résultats limités à la Côte d'Ivoire (countrycodes=ci)

### 3. Bouton "Me Localiser"
- Utilise `navigator.geolocation`
- Gestion des erreurs (GPS désactivé, permission refusée)
- Indicateur de chargement
- Centre la carte sur la position + place le marqueur

### 4. Champ Instructions
- Textarea pour "Indication pour le livreur"
- Placeholder : "Ex: Porte jaune, derrière la boutique bleue..."
- Optionnel (peut être masqué avec `showInstructions={false}`)

### 5. Mode Lecture Seule
- Carte non interactive
- Affiche uniquement le marqueur à la position
- Pas de recherche ni GPS

## 🔌 Hooks Utilisés

### `useGeolocation`

Hook pour accéder au GPS du navigateur.

```typescript
const { 
  position,      // { latitude, longitude, accuracy }
  error,         // { code, message }
  loading,       // boolean
  getCurrentPosition 
} = useGeolocation();
```

### `useGeocoding`

Hook pour les opérations de géocodage via Nominatim.

```typescript
const {
  results,           // GeocodingResult[]
  loading,           // boolean
  error,             // string | null
  search,            // (query: string) => void
  reverseGeocode,    // (lat, lng) => Promise<string>
  clearResults
} = useGeocoding();
```

## 🌍 Configuration Nominatim

```typescript
const NOMINATIM_CONFIG = {
  baseUrl: 'https://nominatim.openstreetmap.org',
  params: {
    format: 'json',
    countrycodes: 'ci',        // Limite à la Côte d'Ivoire
    limit: 5,                   // Max 5 résultats
    addressdetails: 1,
    'accept-language': 'fr'     // Résultats en français
  },
  headers: {
    'User-Agent': 'RAVITO-App/1.5.4'
  }
};
```

## 📍 Centre par Défaut

```typescript
const DEFAULT_CENTER: [number, number] = [5.3600, -4.0083]; // Abidjan
const DEFAULT_ZOOM = 13;
```

## ⚠️ Gestion des Erreurs

Le composant gère automatiquement :
- **GPS Non Disponible** → Message clair + fallback recherche
- **Permission GPS Refusée** → Message explicatif
- **Pas de Connexion** → Placeholder + champ texte de secours
- **Limite Nominatim** → Debounce évite le problème (500ms)
- **Erreur de Recherche** → Message d'erreur affiché

## 🎨 Style et Design

- Style cohérent avec RAVITO (orange #f97316 / teal #14b8a6)
- Bordures arrondies (0.5rem)
- Transitions fluides
- Responsive (mobile-first)
- Icônes Lucide React

## 📱 Responsive

Le composant est entièrement responsive :
- Fonctionne sur mobile, tablette et desktop
- Ajustements automatiques de taille de police
- Touch-friendly sur mobile

## 🔒 Sécurité

- Pas de clés API nécessaires (OpenStreetMap gratuit)
- User-Agent configuré pour respecter les limites de Nominatim
- Debounce pour éviter le spam de requêtes
- Gestion sécurisée des permissions GPS

## 📄 Types TypeScript

Tous les types sont définis dans :
- `src/types/geolocation.ts` - Types spécifiques au géocodage
- `src/types/index.ts` - Type `DeliveryLocation`

## 🔗 Fichiers Associés

```
src/
├── components/
│   └── Shared/
│       └── LocationPicker/
│           ├── LocationPicker.tsx    # Composant principal
│           ├── LocationPicker.css    # Styles
│           └── index.ts              # Export
├── hooks/
│   ├── useGeolocation.ts            # Hook GPS
│   └── useGeocoding.ts              # Hook Nominatim
├── types/
│   └── geolocation.ts               # Types
└── examples/
    └── LocationPickerExamples.tsx   # Exemples d'utilisation
```

## 📚 Documentation Supplémentaire

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Nominatim API](https://nominatim.org/release-docs/develop/api/Search/)
- [OpenStreetMap](https://www.openstreetmap.org/)

## ✅ Critères d'Acceptation

- [x] Composant `LocationPicker` créé et fonctionnel
- [x] Carte Leaflet avec tuiles OpenStreetMap
- [x] Marqueur draggable fonctionnel
- [x] Barre de recherche avec Nominatim (debounce 500ms)
- [x] Bouton "Me localiser" avec gestion GPS
- [x] Champ instructions livreur
- [x] Mode lecture seule (readOnly)
- [x] Hooks `useGeocoding` et `useGeolocation` créés
- [x] Types TypeScript complets
- [x] Gestion des erreurs
- [x] Dépendances installées (leaflet, react-leaflet)
- [x] Import du CSS Leaflet

## 🤝 Contribution

Pour toute modification ou amélioration :
1. Tester le composant dans les différents contextes
2. Vérifier la compatibilité mobile
3. Respecter les limites de l'API Nominatim (debounce)
4. Mettre à jour la documentation si nécessaire
