/**
 * Validation utilities
 */

/**
 * Validates an email address
 * Uses a more robust regex pattern that follows RFC 5322 standards
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic validation first
  const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicPattern.test(email)) {
    return false;
  }

  // More comprehensive validation
  const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return pattern.test(email) && email.length <= 254; // RFC 5321
};

/**
 * Validates a phone number (basic validation for Ivory Coast format)
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Ivory Coast phone numbers are 10 digits
  return /^\d{10}$/.test(cleaned);
};

/**
 * Validates a URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
