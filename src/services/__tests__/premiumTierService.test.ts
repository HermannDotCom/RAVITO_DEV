import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllTiers, hasTierFeature } from '../premiumTierService';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [
              {
                id: '1',
                name: 'basic',
                display_name: 'Basic (Gratuit)',
                price_monthly: 0,
                features: { description: 'Free tier', features: [] },
                max_zones: 3,
                has_priority_placement: false,
                has_advanced_analytics: false,
                has_priority_support: false,
                has_unlimited_zones: false,
                display_order: 1,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                id: '2',
                name: 'silver',
                display_name: 'Silver (5000 FCFA/mois)',
                price_monthly: 5000,
                features: { description: 'Silver tier', features: [] },
                max_zones: 10,
                has_priority_placement: true,
                has_advanced_analytics: false,
                has_priority_support: false,
                has_unlimited_zones: false,
                display_order: 2,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                id: '3',
                name: 'gold',
                display_name: 'Gold (15000 FCFA/mois)',
                price_monthly: 15000,
                features: { description: 'Gold tier', features: [] },
                max_zones: null,
                has_priority_placement: true,
                has_advanced_analytics: true,
                has_priority_support: true,
                has_unlimited_zones: true,
                display_order: 3,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    })),
    rpc: vi.fn((fn: string) => {
      if (fn === 'has_tier_feature') {
        return Promise.resolve({ data: true, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
    }
  }
}));

describe('Premium Tier Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTiers', () => {
    it('should return all available tiers ordered by display order', async () => {
      const tiers = await getAllTiers();
      
      expect(tiers).toHaveLength(3);
      expect(tiers[0].name).toBe('basic');
      expect(tiers[1].name).toBe('silver');
      expect(tiers[2].name).toBe('gold');
    });

    it('should have correct pricing for each tier', async () => {
      const tiers = await getAllTiers();
      
      const basic = tiers.find(t => t.name === 'basic');
      const silver = tiers.find(t => t.name === 'silver');
      const gold = tiers.find(t => t.name === 'gold');

      expect(basic?.priceMonthly).toBe(0);
      expect(silver?.priceMonthly).toBe(5000);
      expect(gold?.priceMonthly).toBe(15000);
    });

    it('should have correct feature flags for Gold tier', async () => {
      const tiers = await getAllTiers();
      const gold = tiers.find(t => t.name === 'gold');

      expect(gold?.hasPriorityPlacement).toBe(true);
      expect(gold?.hasAdvancedAnalytics).toBe(true);
      expect(gold?.hasPrioritySupport).toBe(true);
      expect(gold?.hasUnlimitedZones).toBe(true);
    });

    it('should have correct zone limits', async () => {
      const tiers = await getAllTiers();
      
      const basic = tiers.find(t => t.name === 'basic');
      const silver = tiers.find(t => t.name === 'silver');
      const gold = tiers.find(t => t.name === 'gold');

      expect(basic?.maxZones).toBe(3);
      expect(silver?.maxZones).toBe(10);
      expect(gold?.maxZones).toBeNull(); // Unlimited
    });
  });

  describe('hasTierFeature', () => {
    it('should check if supplier has a specific feature', async () => {
      const hasFeature = await hasTierFeature('test-supplier-id', 'priority_placement');
      
      expect(hasFeature).toBe(true);
    });
  });
});
