import { describe, it, expect } from 'vitest';
import {
  validatePhoneCI,
  formatPhoneCI,
  validateEmail,
  validatePassword,
  validateFullName,
} from '../validations';

describe('validatePhoneCI', () => {
  it('should validate correct Ivorian phone numbers', () => {
    expect(validatePhoneCI('0712345678').isValid).toBe(true);
    expect(validatePhoneCI('0512345678').isValid).toBe(true);
    expect(validatePhoneCI('0112345678').isValid).toBe(true);
  });

  it('should reject phone numbers with wrong prefix', () => {
    const result = validatePhoneCI('0912345678');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('07, 05 ou 01');
  });

  it('should reject phone numbers with wrong length', () => {
    const result = validatePhoneCI('071234567');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('10 chiffres');
  });

  it('should reject empty phone number', () => {
    const result = validatePhoneCI('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('requis');
  });

  it('should accept phone numbers with spaces', () => {
    const result = validatePhoneCI('07 12 34 56 78');
    expect(result.isValid).toBe(true);
  });
});

describe('formatPhoneCI', () => {
  it('should format phone numbers correctly', () => {
    expect(formatPhoneCI('0712345678')).toBe('07 12 34 56 78');
    expect(formatPhoneCI('07')).toBe('07');
    expect(formatPhoneCI('071')).toBe('07 1');
    expect(formatPhoneCI('0712')).toBe('07 12');
  });

  it('should remove non-numeric characters', () => {
    expect(formatPhoneCI('07-12-34-56-78')).toBe('07 12 34 56 78');
    expect(formatPhoneCI('07.12.34.56.78')).toBe('07 12 34 56 78');
  });

  it('should limit to 10 digits', () => {
    expect(formatPhoneCI('071234567890')).toBe('07 12 34 56 78');
  });
});

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com').isValid).toBe(true);
    expect(validateEmail('user.name@example.co.uk').isValid).toBe(true);
    expect(validateEmail('user+tag@example.com').isValid).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid').isValid).toBe(false);
    expect(validateEmail('invalid@').isValid).toBe(false);
    expect(validateEmail('@example.com').isValid).toBe(false);
    expect(validateEmail('invalid@example').isValid).toBe(false);
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('requis');
  });
});

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    const result = validatePassword('SecurePass123!');
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('should reject weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate password with 8 characters, uppercase, and number', () => {
    const result = validatePassword('SecureP1');
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should calculate password strength score', () => {
    expect(validatePassword('weak').score).toBeLessThan(2);
    expect(validatePassword('SecurePass1').score).toBeGreaterThanOrEqual(3);
    expect(validatePassword('SecurePass123!').score).toBeGreaterThanOrEqual(4);
  });

  it('should provide helpful error messages', () => {
    const result = validatePassword('short');
    expect(result.errors).toContain('Au moins 8 caractères');
    expect(result.errors).toContain('Au moins une majuscule');
    expect(result.errors).toContain('Au moins un chiffre');
  });

  it('should assign correct labels', () => {
    expect(validatePassword('weak').label).toBe('Très faible');
    expect(validatePassword('SecureP1').label).toBe('Fort');
  });
});

describe('validateFullName', () => {
  it('should validate correct full names', () => {
    expect(validateFullName('Jean Kouassi').isValid).toBe(true);
    expect(validateFullName('Marie Claire Ahoua').isValid).toBe(true);
  });

  it('should reject single names', () => {
    const result = validateFullName('Jean');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('prénom et nom');
  });

  it('should reject short names', () => {
    const result = validateFullName('AB');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('requis');
  });

  it('should reject empty names', () => {
    const result = validateFullName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('requis');
  });

  it('should handle multiple spaces correctly', () => {
    expect(validateFullName('Jean    Kouassi').isValid).toBe(true);
  });
});
