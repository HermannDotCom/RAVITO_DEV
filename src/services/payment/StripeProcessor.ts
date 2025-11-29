import { BasePaymentProcessor } from './BasePaymentProcessor';
import { PaymentRequest, PaymentResponse, PaymentVerification } from './types';

/**
 * Stripe Payment Processor Stub
 * Placeholder for future Stripe integration for card payments
 * This is a stub implementation for future-proofing
 */
export class StripeProcessor extends BasePaymentProcessor {
  protected providerName = 'Stripe';
  protected providerPrefix = 'STRIPE';

  // Store pending transactions for verification
  private pendingTransactions = new Map<string, PaymentVerification>();

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.log('info', 'Processing card payment', { orderId: request.orderId, amount: request.amount });

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      this.log('error', 'Validation failed', { error: validation.error });
      return {
        success: false,
        transactionId: '',
        reference: '',
        status: 'failed',
        message: validation.error,
        errorCode: 'VALIDATION_ERROR'
      };
    }

    // TODO: Integrate with Stripe API for card payments
    // This is a stub for future implementation
    
    this.log('warn', 'Card payment requested but not yet implemented');

    return {
      success: false,
      transactionId: '',
      reference: '',
      status: 'failed',
      message: 'Les paiements par carte bancaire seront bientôt disponibles. Veuillez utiliser Mobile Money pour le moment.',
      errorCode: 'FEATURE_NOT_AVAILABLE'
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    this.log('info', 'Verifying payment', { transactionId });

    // TODO: Retrieve payment intent from Stripe API in production
    
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (!transaction) {
      this.log('error', 'Transaction not found', { transactionId });
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * Clear old transactions (cleanup method)
   */
  clearOldTransactions(olderThanHours = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [txnId, verification] of this.pendingTransactions.entries()) {
      if (verification.timestamp < cutoffTime) {
        this.pendingTransactions.delete(txnId);
      }
    }
  }
}
