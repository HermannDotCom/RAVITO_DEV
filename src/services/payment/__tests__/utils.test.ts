import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTransactionReference,
  validatePhoneNumber,
  normalizePhoneNumber,
} from '../utils';

describe('Payment Utils', () => {
  describe('generateTransactionReference', () => {
    it('should generate reference with correct prefix', () => {
      const ref = generateTransactionReference('OM');
      expect(ref).toMatch(/^OM-\d+-[A-Z0-9]+$/);
    });

    it('should generate unique references', () => {
      const ref1 = generateTransactionReference('MTN');
      const ref2 = generateTransactionReference('MTN');
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate local format (07XXXXXXXX)', () => {
      expect(validatePhoneNumber('0712345678')).toBe(true);
      expect(validatePhoneNumber('0512345678')).toBe(true);
      expect(validatePhoneNumber('0412345678')).toBe(true);
    });

    it('should validate international format (+225)', () => {
      expect(validatePhoneNumber('+2250712345678')).toBe(true);
      expect(validatePhoneNumber('+2250512345678')).toBe(true);
    });

    it('should validate 00 international format', () => {
      expect(validatePhoneNumber('002250712345678')).toBe(true);
    });

    it('should accept numbers with spaces and dashes', () => {
      expect(validatePhoneNumber('07 12 34 56 78')).toBe(true);
      expect(validatePhoneNumber('07-12-34-56-78')).toBe(true);
      expect(validatePhoneNumber('07.12.34.56.78')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validatePhoneNumber('1234567890')).toBe(false);
      expect(validatePhoneNumber('07123456')).toBe(false);
      expect(validatePhoneNumber('0912345678')).toBe(false);
      expect(validatePhoneNumber('+1234567890')).toBe(false);
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should normalize local format to international', () => {
      expect(normalizePhoneNumber('0712345678')).toBe('+225712345678');
      expect(normalizePhoneNumber('0512345678')).toBe('+225512345678');
    });

    it('should keep international format unchanged', () => {
      expect(normalizePhoneNumber('+2250712345678')).toBe('+2250712345678');
    });

    it('should convert 00 format to + format', () => {
      expect(normalizePhoneNumber('002250712345678')).toBe('+2250712345678');
    });

    it('should remove spaces and dashes', () => {
      expect(normalizePhoneNumber('07 12 34 56 78')).toBe('+225712345678');
      expect(normalizePhoneNumber('07-12-34-56-78')).toBe('+225712345678');
    });
  });
});
