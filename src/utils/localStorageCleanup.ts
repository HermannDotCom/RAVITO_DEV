/**
 * localStorage Cleanup Utility
 * 
 * This module provides safe, targeted cleanup of obsolete localStorage keys.
 * Instead of aggressively deleting all keys except a whitelist, it only removes
 * known obsolete keys from previous versions.
 */

/**
 * Known obsolete localStorage keys from previous versions that should be removed.
 * These keys are no longer used in the current version of the application.
 * 
 * Add keys here only if they are confirmed to be obsolete and no longer needed.
 * DO NOT add keys that are still in use!
 */
const OBSOLETE_KEYS: string[] = [
  // Example: 'old-app-data', 'deprecated-user-settings'
  // Add obsolete keys here as they are identified during migrations
];

/**
 * Keys that should never be removed - these are actively used by the application.
 * This list serves as documentation and a safety check.
 */
const PROTECTED_KEYS: string[] = [
  'theme',                                  // User theme preference (dark/light)
  'sb-byuwnxrfnfkxtmegyazj-auth-token',   // Supabase authentication token
  'distri-night-orders',                   // Order data
  'distri-night-ratings',                  // Rating data
  'distri-night-transfers',                // Transfer data
  'distri-night-commission-settings',      // Commission settings
  'distri-night-users',                    // User data
  'distri-night-backups',                  // Backup data
];

/**
 * Safely removes obsolete localStorage keys.
 * Only removes keys that are explicitly listed in OBSOLETE_KEYS.
 * Logs all cleanup operations for debugging and audit purposes.
 * 
 * @param enableLogging - Whether to log cleanup operations (default: true in development)
 * @returns Object containing cleanup statistics
 */
export function cleanupObsoleteLocalStorage(enableLogging: boolean = import.meta.env.DEV): {
  removed: string[];
  protected: number;
  total: number;
} {
  const stats = {
    removed: [] as string[],
    protected: 0,
    total: 0,
  };

  try {
    // Safety check: ensure we have obsolete keys to remove
    if (OBSOLETE_KEYS.length === 0) {
      if (enableLogging) {
        console.log('[localStorage Cleanup] No obsolete keys defined - skipping cleanup');
      }
      return stats;
    }

    stats.total = localStorage.length;

    if (enableLogging) {
      console.log(`[localStorage Cleanup] Starting cleanup. Total keys: ${stats.total}`);
    }

    // Iterate through obsolete keys and remove them if they exist
    OBSOLETE_KEYS.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        try {
          localStorage.removeItem(key);
          stats.removed.push(key);
          if (enableLogging) {
            console.log(`[localStorage Cleanup] Removed obsolete key: ${key}`);
          }
        } catch (error) {
          console.error(`[localStorage Cleanup] Failed to remove key "${key}":`, error);
        }
      }
    });

    // Count protected keys for reporting
    PROTECTED_KEYS.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        stats.protected++;
      }
    });

    if (enableLogging) {
      console.log('[localStorage Cleanup] Cleanup complete:', {
        removed: stats.removed.length,
        protected: stats.protected,
        total: stats.total,
      });
    }
  } catch (error) {
    console.error('[localStorage Cleanup] Cleanup failed:', error);
  }

  return stats;
}

/**
 * Validates that a key is safe to use (not in the obsolete list).
 * This can be used by other parts of the application to check keys before using them.
 * 
 * @param key - The localStorage key to validate
 * @returns true if the key is safe to use, false if it's obsolete
 */
export function isKeySafe(key: string): boolean {
  return !OBSOLETE_KEYS.includes(key);
}

/**
 * Gets the list of protected keys for reference.
 * Useful for documentation and debugging.
 * 
 * @returns Array of protected key names
 */
export function getProtectedKeys(): readonly string[] {
  return Object.freeze([...PROTECTED_KEYS]);
}

/**
 * Gets the list of obsolete keys that will be removed during cleanup.
 * Useful for documentation and debugging.
 * 
 * @returns Array of obsolete key names
 */
export function getObsoleteKeys(): readonly string[] {
  return Object.freeze([...OBSOLETE_KEYS]);
}
