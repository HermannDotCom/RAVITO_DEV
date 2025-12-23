# Rating Details Modal - Implementation Guide

## Overview
This document provides a comprehensive guide to the rating details modal feature implementation.

## Architecture

### Component Hierarchy
```
RatingBadge (Clickable)
  └─> RatingDetailsModal
       ├─> Rating Summary (Stars + Average)
       ├─> RatingDistribution (Chart)
       └─> ReviewList
            └─> ReviewCard (multiple)
```

### Data Flow
```
User clicks RatingBadge
  └─> Opens RatingDetailsModal
       └─> useRatingDetails hook
            └─> ratingService
                 ├─> getRatingDetails() → Average, Total, Distribution
                 ├─> getReviews() → Paginated reviews
                 └─> Database (Supabase)
```

## Components

### 1. RatingBadge
**Location**: `src/components/Shared/RatingBadge.tsx`

**Purpose**: Display rating as a clickable badge

**Props**:
```typescript
{
  rating: number;           // 0-5 rating value
  reviewCount: number;      // Total number of reviews
  userId: string;           // User to show ratings for
  userType: 'client' | 'supplier';
  userName?: string;        // Optional display name
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;      // Default: true
}
```

**Usage Example**:
```tsx
<RatingBadge
  rating={4.5}
  reviewCount={127}
  userId="supplier-id"
  userType="supplier"
  size="md"
/>
```

### 2. RatingDetailsModal
**Location**: `src/components/Shared/RatingDetailsModal.tsx`

**Purpose**: Display detailed rating information in a modal

**Features**:
- Average rating with visual stars
- Total review count
- Rating distribution chart
- Paginated review list
- Loading states
- Error handling
- Empty state

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'client' | 'supplier';
  userName?: string;
}
```

### 3. RatingDistribution
**Location**: `src/components/Shared/RatingDistribution.tsx`

**Purpose**: Visualize rating distribution with progress bars

**Props**:
```typescript
{
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  total: number;
}
```

**Visual Output**:
```
5 ⭐ ████████████████████████ 85% (108)
4 ⭐ ████████                10% (13)
3 ⭐ ██                       3% (4)
2 ⭐ █                        1% (1)
1 ⭐ █                        1% (1)
```

### 4. ReviewCard
**Location**: `src/components/Shared/ReviewCard.tsx`

**Purpose**: Display individual review with comment and date

**Features**:
- Star rating visualization
- Comment text (if provided)
- Relative date formatting
- Anonymous reviewer label

**Review Format**:
```
⭐⭐⭐⭐⭐  •  Il y a 2 jours
"Livraison rapide et produits de qualité."
— Client masqué
```

## Services

### ratingService.ts
**Location**: `src/services/ratingService.ts`

**New Functions**:

#### getRatingDetails()
```typescript
getRatingDetails(
  userId: string,
  userType: 'client' | 'supplier'
): Promise<RatingDetails | null>
```
Returns complete rating statistics for a user.

#### getReviews()
```typescript
getReviews(
  userId: string,
  userType: 'client' | 'supplier',
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: Review[]; hasMore: boolean }>
```
Returns paginated reviews with hasMore flag.

#### getRatingDistribution()
```typescript
getRatingDistribution(
  userId: string,
  userType: 'client' | 'supplier'
): Promise<RatingDistribution>
```
Calculates and returns rating distribution.

## Hooks

### useRatingDetails
**Location**: `src/hooks/useRatingDetails.ts`

**Purpose**: Manage rating data fetching and pagination

**Returns**:
```typescript
{
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
  reviews: Review[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**Usage**:
```tsx
const {
  averageRating,
  totalReviews,
  distribution,
  reviews,
  hasMore,
  loadMore,
  isLoading
} = useRatingDetails(userId, userType);
```

## Types

### Rating Types
**Location**: `src/types/rating.ts`

```typescript
interface RatingDetails {
  userId: string;
  userType: 'client' | 'supplier';
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerType: 'client' | 'supplier';
}

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}
```

## Integration Points

### Supplier Components

#### SupplierOrderSections
Shows client ratings when viewing available orders.

**Before**:
```tsx
<Star className="h-4 w-4" />
<span>{order.clientRating?.toFixed(1)}</span>
```

**After**:
```tsx
<RatingBadge
  rating={order.clientRating}
  reviewCount={1}
  userId={order.clientId}
  userType="client"
  size="sm"
/>
```

#### ActiveDeliveries
Shows client ratings during active deliveries.

### Client Components

#### ReceivedOffers
Shows supplier ratings when reviewing offers.

**Integration**:
```tsx
<RatingBadge
  rating={offer.supplierRating}
  reviewCount={1}
  userId={offer.supplierId}
  userType="supplier"
  size="sm"
/>
```

#### OrderTracking, OrderHistory, OrderDetailsModal
All show supplier ratings with clickable badges.

## Security Features

### Anonymity Preservation
- ✅ No personal information in reviews
- ✅ Reviews show only "Client masqué" or "Fournisseur masqué"
- ✅ No names, emails, or phone numbers exposed

### Data Security
- ✅ Parameterized Supabase queries (SQL injection protection)
- ✅ React automatic XSS escaping
- ✅ Minimal data exposure (only necessary fields)
- ✅ Relies on existing RLS policies

### Fields Exposed
```sql
SELECT id, overall, comment, created_at, from_user_role
FROM ratings
WHERE to_user_id = ? AND to_user_role = ?
```

## Testing

### Test Files
1. `RatingBadge.test.tsx` - 7 tests
2. `ReviewCard.test.tsx` - 6 tests
3. `RatingDistribution.test.tsx` - 5 tests

### Test Coverage
- ✅ Component rendering
- ✅ Props handling
- ✅ Clickability states
- ✅ Edge cases (zero ratings, null comments)
- ✅ Date formatting
- ✅ Percentage calculations

### Running Tests
```bash
npm test -- src/components/Shared/__tests__/
```

## Usage Examples

### Example 1: Client Viewing Supplier Ratings
```tsx
// In ReceivedOffers.tsx
<RatingBadge
  rating={4.7}
  reviewCount={127}
  userId="supplier-123"
  userType="supplier"
  userName="Distributeur ABC"
/>
```

**User Experience**:
1. Client sees "⭐ 4.7 ›" badge
2. Clicks badge
3. Modal opens showing:
   - Average: 4.7/5 (127 avis)
   - Distribution chart
   - Recent reviews with comments
   - "Voir plus d'avis" button for pagination

### Example 2: Supplier Viewing Client Ratings
```tsx
// In SupplierOrderSections.tsx
<RatingBadge
  rating={4.2}
  reviewCount={1}
  userId="client-456"
  userType="client"
  size="sm"
/>
```

### Example 3: Non-Clickable Badge
```tsx
<RatingBadge
  rating={3.8}
  reviewCount={5}
  userId="user-789"
  userType="client"
  clickable={false}
/>
```

## Responsive Design

### Desktop
- Modal centered with max-width: 768px
- Comfortable padding and spacing
- Hover effects on clickable elements

### Mobile
- Full-width modal with rounded top corners
- Slide-up animation
- Touch-friendly button sizes
- Optimized scrolling

### Animations
```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Performance Considerations

### Lazy Loading
- Reviews fetched in batches of 10
- Load more on demand

### Caching
- useRatingDetails hook manages data lifecycle
- No unnecessary re-fetches

### Optimization
- React.memo for ReviewCard
- Minimal re-renders
- Efficient pagination

## Troubleshooting

### Modal Not Opening
- Check `reviewCount > 0`
- Verify `clickable !== false`
- Check console for errors

### No Reviews Showing
- Verify userId is correct
- Check Supabase RLS policies
- Verify ratings exist in database

### Pagination Not Working
- Check hasMore flag
- Verify loadMore function
- Check console for API errors

## Future Enhancements

### Potential Additions
1. Filter reviews by rating (e.g., show only 5-star reviews)
2. Sort reviews (most recent, highest rated, etc.)
3. Search within comments
4. Export reviews to PDF/CSV
5. Reply to reviews functionality
6. Photo attachments in reviews

### Database Considerations
If implementing photos:
```sql
ALTER TABLE ratings ADD COLUMN photos JSONB;
```

## Maintenance

### Regular Checks
1. Monitor review load times
2. Check for memory leaks in pagination
3. Update date formatting library if needed
4. Review anonymity preservation
5. Test on new browsers/devices

### Dependencies
- React 18+
- Supabase client
- lucide-react (icons)
- TailwindCSS (styling)

## Support

### Key Files for Reference
- Components: `/src/components/Shared/`
- Services: `/src/services/ratingService.ts`
- Hooks: `/src/hooks/useRatingDetails.ts`
- Types: `/src/types/rating.ts`
- Tests: `/src/components/Shared/__tests__/`

### Debug Mode
Enable console logs by searching for `console.error` in:
- ratingService.ts
- useRatingDetails.ts
