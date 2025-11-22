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

    // TODO: In production, this would integrate with Stripe API
    // For now, return a stub response indicating card payments are coming soon
    
    this.log('warn', 'Card payment requested but not yet implemented');

    return {
      success: false,
      transactionId: '',
      reference: '',
      status: 'failed',
      message: 'Les paiements par carte bancaire seront bientôt disponibles. Veuillez utiliser Mobile Money pour le moment.',
      errorCode: 'FEATURE_NOT_AVAILABLE'
    };

    // Future implementation would look like:
    /*
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: request.amount * 100, // Convert to cents
      currency: 'xof',
      metadata: {
        orderId: request.orderId,
      },
    });

    const reference = this.generateReference();
    const transactionId = paymentIntent.id;

    this.pendingTransactions.set(transactionId, {
      transactionId,
      status: 'pending',
      amount: request.amount,
      timestamp: new Date()
    });

    return {
      success: true,
      transactionId,
      reference,
      status: 'pending',
      message: 'Paiement en cours de traitement',
      // Would include client_secret for frontend card input
    };
    */
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    this.log('info', 'Verifying payment', { transactionId });

    // TODO: In production, retrieve payment intent from Stripe
    // const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    
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
