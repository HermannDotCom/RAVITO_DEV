# VIRAL GROWTH ENGINE - Integration Guide

This guide explains how to integrate the viral growth and referral system into DISTRI-NIGHT.

## Overview

The viral growth engine implements:
- **Dual-sided referral program** for clients and suppliers
- **VIP tier progression** with unlockable perks
- **Gamified achievements** with social sharing
- **Real-time viral metrics** tracking
- **Network effects** through zone bonuses and competition pools

## Database Setup

1. **Run Migrations**
   The following migrations must be applied in order:
   - `20251122000001_create_referral_system.sql` - Referral codes, credits, VIP tiers
   - `20251122000002_create_gamification_system.sql` - Progression, achievements, leaderboards
   - `20251122000003_create_network_effects_analytics.sql` - Viral metrics, network effects

2. **Verify Tables**
   ```sql
   -- Check that all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'referral_codes', 'referrals', 'referral_credits',
     'user_levels', 'user_progression', 'achievements',
     'viral_metrics', 'live_activity_feed'
   );
   ```

## Component Integration

### 1. User Registration Flow

Add referral code input to registration:

```typescript
import { referralService } from './services/referralService';

// In RegisterForm.tsx
const [referralCode, setReferralCode] = useState('');

// Check URL for referral code
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  if (refCode) {
    setReferralCode(refCode);
  }
}, []);

// After successful registration
const handleRegistration = async (userData) => {
  // ... create user account ...
  
  // If referral code provided, validate and create referral
  if (referralCode) {
    const validCode = await referralService.validateReferralCode(referralCode);
    if (validCode) {
      await referralService.createReferral(
        validCode.userId,
        newUser.id,
        referralCode,
        validCode.role,
        newUser.role
      );
    }
  }
  
  // Generate referral code for new user
  await referralService.generateReferralCode(
    newUser.id,
    newUser.name,
    newUser.role
  );
};
```

### 2. Client Dashboard

Add referral dashboard to client interface:

```typescript
import { ReferralDashboard } from './components/Referral/ReferralDashboard';
import { ProgressionTracker } from './components/Gamification/ProgressionTracker';
import { BadgeDisplay } from './components/Gamification/BadgeDisplay';
import { LeaderboardView } from './components/Gamification/LeaderboardView';

// In ClientDashboard.tsx
<div className="space-y-6">
  {/* Existing dashboard content */}
  
  {/* Viral Growth Components */}
  <ReferralDashboard 
    userId={user.id} 
    userName={user.name} 
    userRole="client" 
  />
  
  <ProgressionTracker 
    userId={user.id} 
    userRole="client" 
  />
  
  <BadgeDisplay 
    userId={user.id} 
    userRole="client" 
  />
  
  <LeaderboardView />
</div>
```

### 3. Supplier Dashboard

Add referral program for suppliers:

```typescript
import { ReferralDashboard } from './components/Referral/ReferralDashboard';

// In SupplierDashboard.tsx
<ReferralDashboard 
  userId={user.id} 
  userName={user.name} 
  userRole="supplier" 
/>
```

### 4. Order Completion Flow

Trigger achievement checks and social sharing:

```typescript
import { gamificationService } from './services/gamificationService';
import { viralMetricsService } from './services/viralMetricsService';

// When order is delivered
const handleOrderDelivered = async (order) => {
  // ... existing order completion logic ...
  
  // Check for achievements
  const orderTime = new Date(order.createdAt);
  if (gamificationService.checkNightOwlAchievement(orderTime)) {
    await gamificationService.unlockAchievement(order.clientId, 'night_owl');
  }
  
  const paidAt = new Date(order.paidAt);
  if (gamificationService.checkSpeedChampionAchievement(orderTime, paidAt)) {
    await gamificationService.unlockAchievement(order.clientId, 'speed_champion');
  }
  
  // Show social share prompt
  const referralCode = await referralService.getUserReferralCode(order.clientId);
  if (referralCode) {
    showSharePrompt(order.supplierId, referralCode.code);
  }
};

const showSharePrompt = (supplierId, referralCode) => {
  // Get supplier name
  const message = viralMetricsService.generateOrderShareMessage(
    supplierName,
    referralCode
  );
  
  // Show modal or notification with share buttons
  // "Share your experience on WhatsApp"
  // window.open(`https://wa.me/?text=${message}`, '_blank');
};
```

### 5. Payment Processing

Apply referral credits to orders:

```typescript
import { referralService } from './services/referralService';

const processPayment = async (orderId, userId, totalAmount) => {
  // Get user's available credits
  const credits = await referralService.getUserCredits(userId);
  
  // Show option to use credits
  const useCredits = confirm(
    `You have ${credits.balance.toLocaleString()} FCFA in credits. Use them for this order?`
  );
  
  if (useCredits && credits.balance > 0) {
    const creditAmount = Math.min(credits.balance, totalAmount);
    
    // Apply credits to order
    const success = await referralService.spendCredits(
      userId,
      creditAmount,
      orderId
    );
    
    if (success) {
      // Reduce payment amount
      totalAmount -= creditAmount;
      
      // Update order record with credit applied
      // ... update order in database ...
    }
  }
  
  // Process remaining payment
  // ... payment processing logic ...
};
```

### 6. Admin Analytics

Add viral analytics to admin dashboard:

```typescript
import { ViralAnalyticsDashboard } from './components/Admin/Viral/ViralAnalyticsDashboard';

// In AdminDashboard.tsx
<Tab label="Viral Growth">
  <ViralAnalyticsDashboard />
</Tab>
```

### 7. Social Proof Components

Add live activity feed and health score:

```typescript
import { LiveOrderFeed } from './components/Viral/LiveOrderFeed';
import { MarketplaceHealthScore } from './components/Viral/MarketplaceHealthScore';

// In main marketplace/homepage
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  
  <div className="space-y-6">
    <LiveOrderFeed />
    <MarketplaceHealthScore />
  </div>
</div>
```

## Automated Triggers

### Calculate Marketplace Health (Scheduled)

Run every 5 minutes:

```typescript
// In a scheduled job or serverless function
import { viralMetricsService } from './services/viralMetricsService';

const calculateHealth = async () => {
  const score = await viralMetricsService.calculateMarketplaceHealth();
  console.log('Marketplace health score:', score);
};

// Run via cron job or Supabase Edge Function
```

### Calculate Viral Metrics (Daily)

Run once per day:

```typescript
import { viralMetricsService } from './services/viralMetricsService';

const calculateDailyMetrics = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await viralMetricsService.calculateViralMetrics(yesterday, today);
};
```

## Configuration

### Adjust Reward Amounts

Update in database:

```sql
-- Client referral rewards (50,000 FCFA for referrer, 30,000 for referred)
-- Supplier referral rewards (100,000 FCFA for referrer, 50,000 for referred)
-- These are hardcoded in the trigger function process_referral_conversion()
-- To change, modify supabase/migrations/20251122000001_create_referral_system.sql
```

### Adjust Competition Prize Pools

```sql
-- Update prize amounts
UPDATE supplier_competition_config
SET prize_amount = 300000
WHERE rank = 1;

UPDATE supplier_competition_config
SET prize_amount = 150000
WHERE rank = 2;
```

### Adjust Level Progression

```sql
-- Change client level thresholds
UPDATE user_levels
SET min_orders = 3
WHERE role = 'client' AND level_number = 2;

UPDATE user_levels
SET min_orders = 10
WHERE role = 'client' AND level_number = 3;
```

## Testing

### Test Referral Flow

1. Create test user A
2. Get referral code for user A
3. Create test user B with user A's referral code
4. Make order as user B
5. Mark order as delivered
6. Verify:
   - User A receives 50,000 FCFA credit
   - User B receives 30,000 FCFA credit
   - Referral status is "converted"
   - User A's VIP status incremented

### Test Progression

1. Create test user
2. Complete 5 orders
3. Verify user level upgraded to "Regular"
4. Complete 15 total orders
5. Verify user level upgraded to "VIP"

### Test Achievements

1. Create test order after 2am
2. Deliver order
3. Verify "Night Owl" achievement unlocked
4. Test achievement sharing on WhatsApp

## Monitoring

Key metrics to track:

1. **Viral Coefficient (k)**: Target > 1.3
   ```sql
   SELECT viral_coefficient 
   FROM viral_metrics 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. **Referral Conversion Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'converted') * 100.0 / COUNT(*) as conversion_rate
   FROM referrals
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

3. **Active VIP Users**
   ```sql
   SELECT tier_level, COUNT(*) 
   FROM user_vip_status 
   GROUP BY tier_level;
   ```

4. **Marketplace Health**
   ```sql
   SELECT health_score, bonus_triggered 
   FROM marketplace_health_metrics 
   ORDER BY calculated_at DESC 
   LIMIT 1;
   ```

## Troubleshooting

### Referral credits not appearing

1. Check referral was created: `SELECT * FROM referrals WHERE referred_id = 'user_id';`
2. Check order was delivered: `SELECT status FROM orders WHERE client_id = 'user_id';`
3. Check trigger fired: Look for entries in `credit_transactions`

### Achievements not unlocking

1. Verify achievement exists: `SELECT * FROM achievements WHERE achievement_key = 'night_owl';`
2. Check unlock criteria in `unlock_criteria` column
3. Manually unlock: `SELECT check_achievement_unlock('user_id', 'achievement_key');`

### VIP status not updating

1. Check successful referrals: `SELECT successful_referrals FROM user_vip_status WHERE user_id = 'user_id';`
2. Manually trigger upgrade: `SELECT check_vip_tier_upgrade('user_id');`

## Security Considerations

- All RLS policies are enabled and tested
- Referral codes are unique and validated
- Credit transactions are audited
- SQL injection vulnerabilities eliminated
- Admin-only access to sensitive metrics

## Performance Optimization

- Indexes on foreign keys and frequently queried fields
- RLS policies use EXISTS for better performance
- Live activity feed auto-expires old entries
- Leaderboards updated periodically, not real-time

## Next Steps

1. Add email/SMS notifications for referral conversions
2. Create custom admin reports for viral metrics
3. Add A/B testing for referral rewards
4. Implement seasonal competitions with special prizes
5. Add referral fraud detection
