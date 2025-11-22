/**
 * Integration test for main.tsx to verify localStorage cleanup behavior
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanupObsoleteLocalStorage } from '../localStorageCleanup';

describe('main.tsx localStorage cleanup integration', () => {
  let mockStorage: { [key: string]: string };

  beforeEach(() => {
    // Reset mock storage
    mockStorage = {};
    
    // Mock localStorage
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
  });

  it('should preserve theme preference on app startup', () => {
    // User has set theme to dark
    localStorage.setItem('theme', 'dark');
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // Theme should still be there
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should preserve Supabase auth token on app startup', () => {
    // User is authenticated
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    localStorage.setItem('sb-byuwnxrfnfkxtmegyazj-auth-token', authToken);
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // Auth token should still be there
    expect(localStorage.getItem('sb-byuwnxrfnfkxtmegyazj-auth-token')).toBe(authToken);
  });

  it('should preserve all distri-night application data on app startup', () => {
    // User has application data
    const orders = JSON.stringify([{ id: 1, status: 'paid' }]);
    const ratings = JSON.stringify([{ orderId: 1, rating: 5 }]);
    const transfers = JSON.stringify([{ id: 1, amount: 1000 }]);
    const commissionSettings = JSON.stringify({ clientRate: 0.08, supplierRate: 0.02 });
    const users = JSON.stringify([{ id: 1, name: 'Test User' }]);
    const backups = JSON.stringify([{ timestamp: Date.now() }]);

    localStorage.setItem('distri-night-orders', orders);
    localStorage.setItem('distri-night-ratings', ratings);
    localStorage.setItem('distri-night-transfers', transfers);
    localStorage.setItem('distri-night-commission-settings', commissionSettings);
    localStorage.setItem('distri-night-users', users);
    localStorage.setItem('distri-night-backups', backups);
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // All data should still be there
    expect(localStorage.getItem('distri-night-orders')).toBe(orders);
    expect(localStorage.getItem('distri-night-ratings')).toBe(ratings);
    expect(localStorage.getItem('distri-night-transfers')).toBe(transfers);
    expect(localStorage.getItem('distri-night-commission-settings')).toBe(commissionSettings);
    expect(localStorage.getItem('distri-night-users')).toBe(users);
    expect(localStorage.getItem('distri-night-backups')).toBe(backups);
  });

  it('should preserve custom user preferences on app startup', () => {
    // User has custom preferences from other apps/features
    localStorage.setItem('custom-notification-preference', 'enabled');
    localStorage.setItem('language', 'fr');
    localStorage.setItem('sidebar-collapsed', 'true');
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // Custom preferences should not be touched
    expect(localStorage.getItem('custom-notification-preference')).toBe('enabled');
    expect(localStorage.getItem('language')).toBe('fr');
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('should not cause data loss when called multiple times', () => {
    // User has all types of data
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('distri-night-orders', '[]');
    localStorage.setItem('sb-byuwnxrfnfkxtmegyazj-auth-token', 'token');
    
    // Simulate multiple app reloads
    cleanupObsoleteLocalStorage(false);
    cleanupObsoleteLocalStorage(false);
    cleanupObsoleteLocalStorage(false);
    
    // Data should still be intact
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('distri-night-orders')).toBe('[]');
    expect(localStorage.getItem('sb-byuwnxrfnfkxtmegyazj-auth-token')).toBe('token');
  });

  it('should handle empty localStorage gracefully', () => {
    // User has no data (fresh install)
    expect(localStorage.length).toBe(0);
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // Should not crash or cause issues
    expect(localStorage.length).toBe(0);
  });

  it('should handle partial data gracefully', () => {
    // User has only some data
    localStorage.setItem('theme', 'dark');
    // No other keys
    
    // App starts up and runs cleanup
    cleanupObsoleteLocalStorage(false);
    
    // Theme should still be there
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.length).toBe(1);
  });

  it('demonstrates the difference from old aggressive cleanup', () => {
    // Setup realistic user data
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('sb-byuwnxrfnfkxtmegyazj-auth-token', 'token');
    localStorage.setItem('distri-night-orders', '[{id:1}]');
    localStorage.setItem('distri-night-users', '[{id:1}]');
    localStorage.setItem('language', 'fr'); // Custom preference
    
    const keysBefore = Object.keys(mockStorage).length;
    
    // OLD BEHAVIOR (commented out, for documentation):
    // const allowedKeys = ['theme', 'sb-byuwnxrfnfkxtmegyazj-auth-token'];
    // Object.keys(localStorage).forEach(key => {
    //   if (!allowedKeys.includes(key)) {
    //     localStorage.removeItem(key);
    //   }
    // });
    // Result: Would delete 'distri-night-orders', 'distri-night-users', 'language'
    
    // NEW BEHAVIOR:
    cleanupObsoleteLocalStorage(false);
    
    const keysAfter = Object.keys(mockStorage).length;
    
    // All keys should be preserved (no obsolete keys defined)
    expect(keysAfter).toBe(keysBefore);
    expect(localStorage.getItem('distri-night-orders')).toBe('[{id:1}]');
    expect(localStorage.getItem('distri-night-users')).toBe('[{id:1}]');
    expect(localStorage.getItem('language')).toBe('fr');
  });
});
