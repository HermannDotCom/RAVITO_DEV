import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, isValidUrl } from '../validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user_name@example-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@.com')).toBe(false);
      expect(isValidEmail('invalid @example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct Ivory Coast phone numbers', () => {
      expect(isValidPhone('0123456789')).toBe(true);
      expect(isValidPhone('01 23 45 67 89')).toBe(true);
      expect(isValidPhone('01-23-45-67-89')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
      expect(isValidPhone('01234567890')).toBe(false); // Too long
      expect(isValidPhone('012345678')).toBe(false); // Too short
    });

    it('should handle null and undefined', () => {
      expect(isValidPhone(null as any)).toBe(false);
      expect(isValidPhone(undefined as any)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // Missing protocol
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
    });
  });
});
