import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OrangeMoneyProcessor } from '../OrangeMoneyProcessor';
import { MTNMoneyProcessor } from '../MTNMoneyProcessor';
import { WaveProcessor } from '../WaveProcessor';
import { MoovMoneyProcessor } from '../MoovMoneyProcessor';
import { PaymentRequest } from '../types';
import * as utils from '../utils';

describe('Payment Processors', () => {
  const baseRequest: PaymentRequest = {
    orderId: 'test-order-123',
    amount: 10000,
    paymentMethod: 'orange',
    phoneNumber: '0712345678',
    customerName: 'Test Customer',
  };

  // Mock only specific functions
  beforeEach(() => {
    vi.spyOn(utils, 'shouldSimulateFailure').mockReturnValue(false);
    vi.spyOn(utils, 'simulateNetworkDelay').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OrangeMoneyProcessor', () => {
    let processor: OrangeMoneyProcessor;

    beforeEach(() => {
      processor = new OrangeMoneyProcessor();
    });

    it('should process payment successfully with valid Orange number', async () => {
      const request = { ...baseRequest, phoneNumber: '0712345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
      expect(response.transactionId).toBeTruthy();
      expect(response.reference).toMatch(/^OM-/);
    });

    it('should accept 05 prefix for Orange', async () => {
      const request = { ...baseRequest, phoneNumber: '0512345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
    });

    it('should reject non-Orange numbers', async () => {
      const request = { ...baseRequest, phoneNumber: '0412345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('INVALID_PHONE');
    });

    it('should validate amount', async () => {
      const request = { ...baseRequest, amount: 0 };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should validate orderId', async () => {
      const request = { ...baseRequest, orderId: '' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should validate phone number format', async () => {
      const request = { ...baseRequest, phoneNumber: '123' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should verify payment transaction', async () => {
      const paymentResponse = await processor.processPayment(baseRequest);
      const verification = await processor.verifyPayment(paymentResponse.transactionId);

      expect(verification.transactionId).toBe(paymentResponse.transactionId);
      expect(verification.status).toBe('success');
      expect(verification.amount).toBe(baseRequest.amount);
    });
  });

  describe('MTNMoneyProcessor', () => {
    let processor: MTNMoneyProcessor;

    beforeEach(() => {
      processor = new MTNMoneyProcessor();
    });

    it('should process payment successfully with valid MTN number', async () => {
      const request = { ...baseRequest, paymentMethod: 'mtn' as const, phoneNumber: '0512345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
      expect(response.reference).toMatch(/^MTN-/);
    });

    it('should accept 04 prefix for MTN', async () => {
      const request = { ...baseRequest, paymentMethod: 'mtn' as const, phoneNumber: '0412345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
    });

    it('should reject non-MTN numbers', async () => {
      const request = { ...baseRequest, paymentMethod: 'mtn' as const, phoneNumber: '0712345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('INVALID_PHONE');
    });
  });

  describe('WaveProcessor', () => {
    let processor: WaveProcessor;

    beforeEach(() => {
      processor = new WaveProcessor();
    });

    it('should process payment successfully with any valid number', async () => {
      const request = { ...baseRequest, paymentMethod: 'wave' as const, phoneNumber: '0712345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
      expect(response.reference).toMatch(/^WAVE-/);
    });

    it('should accept different operator numbers', async () => {
      const numbers = ['0712345678', '0512345678', '0412345678'];
      
      for (const phoneNumber of numbers) {
        const request = { ...baseRequest, paymentMethod: 'wave' as const, phoneNumber };
        const response = await processor.processPayment(request);
        expect(response.success).toBe(true);
      }
    });
  });

  describe('MoovMoneyProcessor', () => {
    let processor: MoovMoneyProcessor;

    beforeEach(() => {
      processor = new MoovMoneyProcessor();
    });

    it('should process payment successfully with valid Moov number', async () => {
      const request = { ...baseRequest, paymentMethod: 'moov' as const, phoneNumber: '0112345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe('success');
      expect(response.reference).toMatch(/^MOOV-/);
    });

    it('should reject non-Moov numbers', async () => {
      const request = { ...baseRequest, paymentMethod: 'moov' as const, phoneNumber: '0712345678' };
      const response = await processor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('INVALID_PHONE');
    });
  });
});
