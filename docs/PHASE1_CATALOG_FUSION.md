# Phase 1: Fusion Catalogue Produits - Documentation Technique

## Vue d'ensemble

Cette phase implémente les fondations pour fusionner les deux interfaces de gestion de produits existantes :
- `ProductManagement.tsx` (données mock)
- `AdminReferencePricingDashboard.tsx` (gestion des prix de référence)

Le nouveau composant `AdminCatalogDashboard` combine les fonctionnalités des deux avec l'ajout de la gestion d'images.

## Architecture

### 1. Base de données

#### Migration: `20260124145300_add_image_path_to_products.sql`
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path TEXT;
```

#### Migration: `20260124145400_create_product_images_storage.sql`
- Création du bucket `product-images` (public)
- Policies RLS pour lecture publique et upload/modification/suppression admin uniquement

### 2. Services

#### `src/services/imageUploadService.ts`
Service de gestion des images dans Supabase Storage:
- `uploadProductImage()` - Upload avec validation (formats: JPG, PNG, WebP, max 2Mo)
- `deleteProductImage()` - Suppression d'image
- `getProductImageUrl()` - Récupération de l'URL publique

Organisation des fichiers: `category/productId-timestamp.ext`

#### `src/services/admin/productAdminService.ts`
Service CRUD pour les produits:
- `getAdminProducts(filters?)` - Liste avec filtres optionnels
- `createProduct(input)` - Création
- `updateProduct(id, input)` - Mise à jour
- `deleteProduct(id)` - Suppression
- `toggleProductStatus(id, isActive)` - Toggle actif/inactif

### 3. Composants UI

#### `src/components/Admin/Catalog/AdminCatalogDashboard.tsx`
Composant principal avec:
- Header avec titre et bouton "Nouveau produit"
- Cartes statistiques (Total, Actifs, Inactifs, Marques)
- Filtres (recherche, catégorie, marque, statut)
- Table des produits avec ProductTable
- Modals pour création/édition et suppression

#### `src/components/Admin/Catalog/ProductTable.tsx`
Table responsive avec colonnes:
- Image (thumbnail)
- Produit (nom, référence, marque)
- Catégorie (badge coloré)
- Type casier
- Prix casier
- Prix consigne
- Statut (toggle actif/inactif)
- Actions (modifier, supprimer)

#### `src/components/Admin/Catalog/ProductForm.tsx`
Modal de création/édition avec:
- Upload d'image via ProductImageUpload
- Tous les champs du produit
- Validation des champs requis
- Prix consigne auto-ajusté selon le type de casier

#### `src/components/Admin/Catalog/ProductImageUpload.tsx`
Composant d'upload d'image avec:
- Preview immédiat lors de la sélection
- Upload vers Supabase Storage
- Suppression d'image
- Validation format et taille

#### `src/components/Admin/Catalog/DeleteProductModal.tsx`
Modal de confirmation de suppression avec:
- Affichage des infos du produit
- Avertissement irréversibilité
- Boutons Annuler/Supprimer

### 4. Types

Ajout du champ `imagePath` optionnel à l'interface `Product`:
```typescript
export interface Product {
  // ... autres champs
  imagePath?: string;
  imageUrl: string;
}
```

Mise à jour des types Supabase pour inclure `image_path` dans la table `products`.

## Utilisation

### Accès au composant

Le composant `AdminCatalogDashboard` est exporté et peut être utilisé dans l'interface admin:

```typescript
import { AdminCatalogDashboard } from '../components/Admin/Catalog';

// Dans le routing admin:
<AdminCatalogDashboard />
```

### Flux de travail

1. **Lister les produits**: Chargement automatique depuis Supabase au montage
2. **Filtrer**: Recherche textuelle + filtres catégorie/marque/statut
3. **Créer un produit**: 
   - Clic sur "Nouveau produit"
   - Remplir le formulaire
   - Optionnel: uploader une image
   - Enregistrer
4. **Modifier un produit**:
   - Clic sur icône "Modifier"
   - Modifier les champs
   - Optionnel: changer l'image
   - Enregistrer
5. **Supprimer un produit**:
   - Clic sur icône "Supprimer"
   - Confirmer dans la modal
6. **Toggle statut**: Clic direct sur l'icône toggle dans la table

## Sécurité

### RLS Policies

**Lecture (SELECT)**: Publique pour toutes les images
```sql
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

**Upload/Modification/Suppression**: Admin uniquement
```sql
CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

### Validation côté client

- Formats autorisés: JPG, PNG, WebP
- Taille max: 2 Mo
- Validation des champs requis dans le formulaire

## Design

Le composant utilise:
- **Tailwind CSS** pour le styling
- **Dark mode** supporté via classes `dark:`
- **Couleur principale**: Orange (#FF6B35)
- **Icons**: lucide-react
- **Responsive**: Design mobile-first

## État des composants existants

**IMPORTANT**: Les anciens composants NE SONT PAS supprimés dans cette phase:
- `ProductManagement.tsx` - Conservé (sera supprimé Phase 4)
- `AdminReferencePricingDashboard.tsx` - Conservé (sera supprimé Phase 4)
- `ReferencePriceManager.tsx` - Conservé (sera supprimé Phase 4)

## Prochaines phases

**Phase 2**: Intégration du nouveau composant dans le routing admin
**Phase 3**: Tests et validation avec données réelles
**Phase 4**: Suppression des anciens composants et nettoyage

## Tests

### Build
```bash
npm run build
```
✅ Build réussi sans erreurs TypeScript

### Linter
```bash
npm run lint
```
✅ Aucune erreur dans les nouveaux fichiers

## Fichiers créés

```
supabase/migrations/
  ├── 20260124145300_add_image_path_to_products.sql
  └── 20260124145400_create_product_images_storage.sql

src/services/
  ├── imageUploadService.ts
  └── admin/
      └── productAdminService.ts

src/components/Admin/Catalog/
  ├── index.ts
  ├── AdminCatalogDashboard.tsx
  ├── ProductTable.tsx
  ├── ProductForm.tsx
  ├── ProductImageUpload.tsx
  └── DeleteProductModal.tsx
```

## Notes techniques

- Les prix dans `products` (crate_price, unit_price, consign_price) sont les **prix de référence RAVITO**
- L'image peut être uploadée avant ou après la création du produit
- Les images sont stockées avec un timestamp pour éviter les collisions
- Le composant gère les erreurs avec des messages utilisateur appropriés
