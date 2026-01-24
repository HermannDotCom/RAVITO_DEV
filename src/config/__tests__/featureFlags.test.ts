import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from '../featureFlags';

describe('Feature Flags', () => {
  describe('FEATURE_FLAGS object', () => {
    it('should have USE_PRODUCTS_AS_REFERENCE_SOURCE flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('USE_PRODUCTS_AS_REFERENCE_SOURCE');
      expect(typeof FEATURE_FLAGS.USE_PRODUCTS_AS_REFERENCE_SOURCE).toBe('boolean');
    });

    it('should have USE_NEW_CATALOG_DASHBOARD flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('USE_NEW_CATALOG_DASHBOARD');
      expect(typeof FEATURE_FLAGS.USE_NEW_CATALOG_DASHBOARD).toBe('boolean');
    });

    it('should have USE_PRODUCTS_REALTIME flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('USE_PRODUCTS_REALTIME');
      expect(typeof FEATURE_FLAGS.USE_PRODUCTS_REALTIME).toBe('boolean');
    });

    it('should default all flags to true (new behavior enabled)', () => {
      expect(FEATURE_FLAGS.USE_PRODUCTS_AS_REFERENCE_SOURCE).toBe(true);
      expect(FEATURE_FLAGS.USE_NEW_CATALOG_DASHBOARD).toBe(true);
      expect(FEATURE_FLAGS.USE_PRODUCTS_REALTIME).toBe(true);
    });
  });

  describe('isFeatureEnabled helper', () => {
    it('should return true for enabled flags', () => {
      expect(isFeatureEnabled('USE_PRODUCTS_AS_REFERENCE_SOURCE')).toBe(true);
      expect(isFeatureEnabled('USE_NEW_CATALOG_DASHBOARD')).toBe(true);
      expect(isFeatureEnabled('USE_PRODUCTS_REALTIME')).toBe(true);
    });

    it('should return false for undefined flags', () => {
      // @ts-expect-error Testing invalid flag
      expect(isFeatureEnabled('NONEXISTENT_FLAG')).toBe(false);
    });
  });
});
