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
    /^0[01457]\d{8}$/, // Local format: 0X + 8 digits = 10 digits total (e.g., 0712345678)
    /^\+2250[01457]\d{8}$/, // International format with +: +225 + 0X + 8 digits (e.g., +2250712345678)
    /^002250[01457]\d{8}$/, // International format with 00: 00225 + 0X + 8 digits (e.g., 002250712345678)
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
 */
export const simulateNetworkDelay = (min = 1000, max = 3000): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulate random payment failure for testing (5% failure rate)
 */
export const shouldSimulateFailure = (failureRate = 0.05): boolean => {
  return Math.random() < failureRate;
};
