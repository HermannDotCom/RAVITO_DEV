import { PaymentProcessor, PaymentRequest, PaymentResponse, PaymentVerification } from './types';
import { generateTransactionReference, simulateNetworkDelay, validatePhoneNumber } from './utils';

/**
 * Base abstract class for payment processors
 * Provides common functionality for all payment providers
 */
export abstract class BasePaymentProcessor implements PaymentProcessor {
  protected abstract providerName: string;
  protected abstract providerPrefix: string;

  /**
   * Process a payment request
   */
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify a payment transaction
   */
  abstract verifyPayment(transactionId: string): Promise<PaymentVerification>;

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.providerName;
  }

  /**
   * Generate a transaction reference for this provider
   */
  protected generateReference(): string {
    return generateTransactionReference(this.providerPrefix);
  }

  /**
   * Validate payment request
   */
  protected validateRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (!request.orderId) {
      return { valid: false, error: 'Order ID is required' };
    }

    if (!request.amount || request.amount <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    if (request.phoneNumber && !validatePhoneNumber(request.phoneNumber)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true };
  }

  /**
   * Simulate API call delay
   */
  protected async simulateApiCall(): Promise<void> {
    await simulateNetworkDelay(1500, 3500);
  }

  /**
   * Log payment activity (in production, this would send to logging service)
   */
  protected log(level: 'info' | 'error' | 'warn', message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.providerName}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }
}
