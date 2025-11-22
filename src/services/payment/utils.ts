/**
 * Generate a unique transaction reference
 * Format: PREFIX-TIMESTAMP-RANDOM
 */
export const generateTransactionReference = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Validate phone number format for West African mobile money
 * Accepts formats: 07XXXXXXXX, +2250712345678, 002250712345678
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all spaces, dashes, and dots
  const cleaned = phoneNumber.replace(/[\s\-\\.]/g, '');
  
  // Check for valid patterns
  const patterns = [
    /^0[01457]\d{8}$/, // Local format: 01/04/05/07 + 8 digits = 10 digits total (e.g., 0712345678)
    /^\+2250[01457]\d{8}$/, // International format with +: +225 + 01/04/05/07 + 8 digits (e.g., +2250712345678)
    /^002250[01457]\d{8}$/, // International format with 00: 00225 + 01/04/05/07 + 8 digits (e.g., 002250712345678)
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Normalize phone number to international format
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/[\s\-\\.]/g, '');
  
  // Already in international format
  if (cleaned.startsWith('+225')) {
    return cleaned;
  }
  if (cleaned.startsWith('00225')) {
    return '+' + cleaned.substring(2);
  }
  
  // Local format - add country code
  if (cleaned.startsWith('0')) {
    return '+225' + cleaned.substring(1);
  }
  
  return '+225' + cleaned;
};

/**
 * Simulate network delay (for realistic API behavior)
 * @param min - Minimum delay in milliseconds (default: 1000ms)
 * @param max - Maximum delay in milliseconds (default: 3000ms)
 * @returns Promise that resolves after the delay
 */
export const simulateNetworkDelay = (min = 1000, max = 3000): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulate random payment failure for testing (5% failure rate)
 * @param failureRate - Probability of failure (0-1), default 0.05 (5%)
 */
export const shouldSimulateFailure = (failureRate = 0.05): boolean => {
  return Math.random() < failureRate;
};

/**
 * Validate phone number for specific provider
 * @param phoneNumber - The phone number to validate
 * @param allowedPrefixes - Array of allowed prefixes after country code (e.g., ['7', '5'] for Orange)
 * @returns Object with validation result and error message if invalid
 */
export const validateProviderPhone = (
  phoneNumber: string,
  allowedPrefixes: string[],
  providerName: string
): { valid: boolean; error?: string } => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const phoneDigits = normalizedPhone.replace('+225', '');
  
  const isValid = allowedPrefixes.some(prefix => phoneDigits.startsWith(prefix));
  
  if (!isValid) {
    const prefixList = allowedPrefixes.map(p => `0${p}`).join(' ou ');
    return {
      valid: false,
      error: `Numéro ${providerName} invalide. Doit commencer par ${prefixList}.`
    };
  }
  
  return { valid: true };
};
