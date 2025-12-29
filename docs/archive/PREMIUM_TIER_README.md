# Premium Tier Subscription System

## Overview

This feature implements a comprehensive three-tier subscription system for suppliers, designed to generate predictable recurring revenue (MRR) and create a powerful retention loop through tiered benefits.

## Business Value

- **Predictable Revenue**: Generate monthly recurring revenue through subscription fees
- **Conversion Boost**: Gold tier suppliers see ~40% increase in conversions through priority placement
- **Market Fit**: B2B users in African logistics markets pay 3-5x for convenience features
- **Retention Loop**: Tiered benefits create strong incentives for suppliers to maintain subscriptions

## Tier Structure

### Basic (Free)
- **Price**: 0 FCFA/month
- **Features**:
  - Access to orders in up to 3 zones
  - Standard support
  - Basic statistics
- **Target**: New suppliers, small operations

### Silver (5,000 FCFA/month)
- **Price**: 5,000 FCFA/month
- **Features**:
  - Priority placement in offer lists
  - Access to up to 10 zones
  - Advanced statistics
  - Priority email support
- **Target**: Growing suppliers looking to expand

### Gold (15,000 FCFA/month)
- **Price**: 15,000 FCFA/month
- **Features**:
  - **Priority placement in TOP of offer lists** (40% conversion boost)
  - Unlimited zones
  - Detailed buyer analytics
  - Dedicated priority support
  - Gold badge visible to clients
- **Target**: Professional suppliers seeking maximum reach

## Technical Implementation

### Database Schema

#### Tables

**premium_tiers**
- Stores tier definitions (Basic, Silver, Gold)
- Contains feature flags and pricing
- Fields: name, display_name, price_monthly, features (JSONB), max_zones, has_priority_placement, has_advanced_analytics, has_priority_support, has_unlimited_zones

**supplier_subscriptions**
- Manages supplier subscriptions
- Tracks payment history and status
- Fields: supplier_id, tier_id, status, starts_at, ends_at, auto_renew, payment_method, last_payment_date, next_payment_date, total_paid

#### Database Functions

**get_active_subscription(supplier_uuid)**
- Returns active subscription details for a supplier
- Used for feature access checks

**has_tier_feature(supplier_uuid, feature_name)**
- Checks if supplier has access to a specific feature
- Returns boolean
- Supported features: 'priority_placement', 'advanced_analytics', 'priority_support', 'unlimited_zones'

### Services

**premiumTierService.ts**
- `getAllTiers()`: Get all available tiers
- `getTierByName(tierName)`: Get specific tier details
- `getActiveSubscription(supplierId)`: Get supplier's active subscription
- `hasTierFeature(supplierId, feature)`: Check feature access
- `createOrUpgradeSubscription()`: Create new subscription
- `activateSubscription()`: Activate pending subscription (admin)
- `cancelSubscription()`: Cancel subscription
- `getAllSubscriptions()`: Get all subscriptions (admin)
- `getSubscriptionStats()`: Get MRR and stats (admin)

**supplierOfferService.ts** (Updated)
- `getOffersByOrder()`: Now prioritizes Gold tier suppliers first in offer lists
- Implements sorting: Gold tier → Silver tier → Basic tier (within each tier, newest first)

### UI Components

#### Supplier Dashboard
**PremiumTierDashboard** (`src/components/Supplier/PremiumTierDashboard.tsx`)
- Shows current tier and active benefits
- Displays upgrade options with pricing
- Explains Gold tier conversion boost value proposition
- One-click upgrade flow

#### Admin Dashboard
**PremiumTierManagement** (`src/components/Admin/PremiumTierManagement.tsx`)
- View all subscriptions with filters
- Activate pending subscriptions after payment
- Cancel/manage subscriptions
- MRR tracking and analytics
- Distribution by tier

### Navigation

- **Suppliers**: Sidebar → "Abonnement Premium"
- **Admin**: Sidebar → "Abonnements Premium"

## Feature Flags

The system includes a robust feature flag mechanism to enable/disable features based on tier:

```typescript
// Check if supplier has priority placement
const hasPriority = await hasTierFeature(supplierId, 'priority_placement');

// Check if supplier has advanced analytics
const hasAnalytics = await hasTierFeature(supplierId, 'advanced_analytics');

// Check if supplier has priority support
const hasSupport = await hasTierFeature(supplierId, 'priority_support');

// Check if supplier has unlimited zones
const hasUnlimited = await hasTierFeature(supplierId, 'unlimited_zones');
```

## Priority Placement Algorithm

Gold tier suppliers appear FIRST in client offer lists:

1. Fetch all offers for an order
2. Retrieve supplier subscriptions and tier information
3. Sort offers by:
   - Primary: Tier display_order (Gold=3, Silver=2, Basic=1) - descending
   - Secondary: Creation date - newest first
4. Return sorted list to client

This ensures Gold tier suppliers have maximum visibility, driving the ~40% conversion boost.

## Row Level Security (RLS)

All premium tier tables have RLS enabled:

- **premium_tiers**: Public read access, admin-only write
- **supplier_subscriptions**: 
  - Suppliers can view/manage their own subscriptions
  - Admin can view/manage all subscriptions
  - Secure by default

## Migration

**Migration File**: `supabase/migrations/20251122000001_create_premium_tier_system.sql`

The migration automatically:
1. Creates all necessary tables and types
2. Seeds the three tier definitions
3. Assigns all existing suppliers to Basic tier
4. Sets up RLS policies
5. Creates database functions

## Testing

**Test File**: `src/services/__tests__/premiumTierService.test.ts`

Tests cover:
- Tier retrieval and ordering
- Pricing validation
- Feature flag validation
- Zone limit validation
- Feature access checks

Run tests:
```bash
npm test
```

## Usage Examples

### Supplier Upgrading to Gold

```typescript
const result = await createOrUpgradeSubscription(
  supplierId,
  'gold',
  'orange' // payment method
);

if (result.success) {
  // Subscription created, pending admin activation after payment
}
```

### Admin Activating Subscription

```typescript
const result = await activateSubscription(subscriptionId);

if (result.success) {
  // Subscription activated, supplier now has Gold benefits
}
```

### Checking Feature Access

```typescript
const hasPriority = await hasTierFeature(supplierId, 'priority_placement');

if (hasPriority) {
  // Show Gold badge, enable advanced features
}
```

## Revenue Projections

With 100 suppliers:
- 70% Basic (Free): 70 × 0 = 0 FCFA
- 20% Silver: 20 × 5,000 = 100,000 FCFA/month
- 10% Gold: 10 × 15,000 = 150,000 FCFA/month
- **Total MRR: 250,000 FCFA/month** (3,000,000 FCFA/year)

## Future Enhancements

1. **Automated Billing**: Integrate with payment providers for auto-renewal
2. **Analytics Dashboard**: Detailed ROI analytics for Gold tier suppliers
3. **A/B Testing**: Test different tier pricing and features
4. **Referral Program**: Gold suppliers get bonus for referring other suppliers
5. **Seasonal Promotions**: Limited-time upgrade offers

## Support

For questions or issues:
- Technical: Review this documentation and source code
- Business: Contact product team for pricing strategy questions
