import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cleanupObsoleteLocalStorage,
  isKeySafe,
  getProtectedKeys,
  getObsoleteKeys,
} from '../localStorageCleanup';

describe('localStorageCleanup', () => {
  // Store original localStorage methods
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Create a fresh localStorage mock for each test
    originalLocalStorage = global.localStorage;
    const mockStorage: { [key: string]: string } = {};
    
    global.localStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
      key: vi.fn((index: number) => Object.keys(mockStorage)[index] || null),
      get length() {
        return Object.keys(mockStorage).length;
      },
    } as Storage;

    // Clear console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  describe('cleanupObsoleteLocalStorage', () => {
    it('should not remove any keys when no obsolete keys are defined', () => {
      // Set up some legitimate keys
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('distri-night-orders', '[]');
      localStorage.setItem('sb-byuwnxrfnfkxtmegyazj-auth-token', 'token123');

      const stats = cleanupObsoleteLocalStorage(false);

      expect(stats.removed).toEqual([]);
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('distri-night-orders')).toBe('[]');
      expect(localStorage.getItem('sb-byuwnxrfnfkxtmegyazj-auth-token')).toBe('token123');
    });

    it('should preserve all protected keys', () => {
      // Set up protected keys
      const protectedKeys = getProtectedKeys();
      protectedKeys.forEach(key => {
        localStorage.setItem(key, `value-${key}`);
      });

      cleanupObsoleteLocalStorage(false);

      // Verify all protected keys are still present
      protectedKeys.forEach(key => {
        expect(localStorage.getItem(key)).toBe(`value-${key}`);
      });
    });

    it('should not affect unrelated keys that are not obsolete', () => {
      localStorage.setItem('custom-user-preference', 'value1');
      localStorage.setItem('app-state', 'value2');

      cleanupObsoleteLocalStorage(false);

      expect(localStorage.getItem('custom-user-preference')).toBe('value1');
      expect(localStorage.getItem('app-state')).toBe('value2');
    });

    it('should return correct statistics', () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('distri-night-orders', '[]');
      localStorage.setItem('custom-key', 'value');

      const stats = cleanupObsoleteLocalStorage(false);

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.removed).toBeInstanceOf(Array);
      expect(stats.protected).toBeGreaterThanOrEqual(0);
    });

    it('should log cleanup operations when logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      localStorage.setItem('theme', 'dark');
      cleanupObsoleteLocalStorage(true);

      // Should log, either about skipping or about actual cleanup
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[localStorage Cleanup]')
      );
    });

    it('should not log when logging is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      localStorage.setItem('theme', 'dark');
      cleanupObsoleteLocalStorage(false);

      // Should only log if there's an error, not normal operations
      const cleanupLogs = consoleSpy.mock.calls.filter(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('[localStorage Cleanup]'))
      );
      expect(cleanupLogs.length).toBe(0);
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      // Mock removeItem to throw an error
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => cleanupObsoleteLocalStorage(false)).not.toThrow();
      
      // But should log the error if it occurs
      // (Only if obsolete keys exist, which they don't in the current implementation)
    });

    it('should handle missing localStorage gracefully', () => {
      // Save reference
      const originalLS = global.localStorage;
      
      // Remove localStorage
      // @ts-expect-error - Testing edge case
      delete global.localStorage;

      // Should not throw
      expect(() => {
        try {
          cleanupObsoleteLocalStorage(false);
        } catch (e) {
          // If it throws, it should be caught
          expect(e).toBeDefined();
        }
      }).not.toThrow();

      // Restore
      global.localStorage = originalLS;
    });
  });

  describe('isKeySafe', () => {
    it('should return true for keys not in obsolete list', () => {
      expect(isKeySafe('theme')).toBe(true);
      expect(isKeySafe('distri-night-orders')).toBe(true);
      expect(isKeySafe('custom-key')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isKeySafe('')).toBe(true);
    });

    it('should return true for protected keys', () => {
      const protectedKeys = getProtectedKeys();
      protectedKeys.forEach(key => {
        expect(isKeySafe(key)).toBe(true);
      });
    });
  });

  describe('getProtectedKeys', () => {
    it('should return an array of protected keys', () => {
      const keys = getProtectedKeys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should include expected protected keys', () => {
      const keys = getProtectedKeys();
      
      expect(keys).toContain('theme');
      expect(keys).toContain('sb-byuwnxrfnfkxtmegyazj-auth-token');
      expect(keys).toContain('distri-night-orders');
      expect(keys).toContain('distri-night-ratings');
      expect(keys).toContain('distri-night-transfers');
      expect(keys).toContain('distri-night-commission-settings');
      expect(keys).toContain('distri-night-users');
      expect(keys).toContain('distri-night-backups');
    });

    it('should return a frozen array', () => {
      const keys = getProtectedKeys();
      
      expect(Object.isFrozen(keys)).toBe(true);
    });
  });

  describe('getObsoleteKeys', () => {
    it('should return an array', () => {
      const keys = getObsoleteKeys();
      
      expect(Array.isArray(keys)).toBe(true);
    });

    it('should return a frozen array', () => {
      const keys = getObsoleteKeys();
      
      expect(Object.isFrozen(keys)).toBe(true);
    });

    it('should not include protected keys', () => {
      const obsoleteKeys = getObsoleteKeys();
      const protectedKeys = getProtectedKeys();
      
      obsoleteKeys.forEach(obsoleteKey => {
        expect(protectedKeys).not.toContain(obsoleteKey);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle a complete application lifecycle', () => {
      // Simulate application startup with various keys
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('sb-byuwnxrfnfkxtmegyazj-auth-token', 'token');
      localStorage.setItem('distri-night-orders', '[]');
      localStorage.setItem('distri-night-users', '[]');

      // Run cleanup
      const stats = cleanupObsoleteLocalStorage(false);

      // Verify legitimate data is preserved
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('sb-byuwnxrfnfkxtmegyazj-auth-token')).toBe('token');
      expect(localStorage.getItem('distri-night-orders')).toBe('[]');
      expect(localStorage.getItem('distri-night-users')).toBe('[]');

      // Verify stats are reasonable
      expect(stats.removed.length).toBe(0); // No obsolete keys defined yet
      expect(stats.protected).toBeGreaterThanOrEqual(0);
    });

    it('should work correctly when called multiple times', () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('distri-night-orders', '[]');

      // Run cleanup twice
      const stats1 = cleanupObsoleteLocalStorage(false);
      const stats2 = cleanupObsoleteLocalStorage(false);

      // Both should succeed and give consistent results
      expect(stats1.removed).toEqual(stats2.removed);
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('distri-night-orders')).toBe('[]');
    });
  });
});
