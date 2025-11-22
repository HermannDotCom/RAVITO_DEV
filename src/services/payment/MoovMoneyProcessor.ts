import { BasePaymentProcessor } from './BasePaymentProcessor';
import { PaymentRequest, PaymentResponse, PaymentVerification } from './types';
import { validateProviderPhone, shouldSimulateFailure } from './utils';

/**
 * Moov Money Payment Processor Mock
 * Simulates Moov Money API integration for Côte d'Ivoire
 */
export class MoovMoneyProcessor extends BasePaymentProcessor {
  protected providerName = 'Moov Money';
  protected providerPrefix = 'MOOV';

  // Store pending transactions for verification
  private pendingTransactions = new Map<string, PaymentVerification>();

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.log('info', 'Processing payment', { orderId: request.orderId, amount: request.amount });

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

    // Validate phone number for Moov (must start with 01 in local format, or 1 after +225)
    const phoneValidation = validateProviderPhone(request.phoneNumber!, ['1'], 'Moov Money');
    if (!phoneValidation.valid) {
      this.log('error', 'Invalid Moov Money phone number', { phone: request.phoneNumber });
      return {
        success: false,
        transactionId: '',
        reference: '',
        status: 'failed',
        message: phoneValidation.error!,
        errorCode: 'INVALID_PHONE'
      };
    }

    // Simulate API call to Moov Money
    await this.simulateApiCall();

    // Generate transaction reference
    const reference = this.generateReference();
    const transactionId = `TXN-${reference}`;

    // Simulate random failures (5% chance)
    if (shouldSimulateFailure()) {
      this.log('warn', 'Payment simulation failed', { transactionId, reference });
      
      // Store failed transaction
      this.pendingTransactions.set(transactionId, {
        transactionId,
        status: 'failed',
        amount: request.amount,
        timestamp: new Date()
      });

      return {
        success: false,
        transactionId,
        reference,
        status: 'failed',
        message: 'Échec du paiement. Solde insuffisant ou PIN incorrect.',
        errorCode: 'PAYMENT_DECLINED'
      };
    }

    // Store successful transaction
    this.pendingTransactions.set(transactionId, {
      transactionId,
      status: 'success',
      amount: request.amount,
      timestamp: new Date()
    });

    this.log('info', 'Payment processed successfully', { transactionId, reference });

    return {
      success: true,
      transactionId,
      reference,
      status: 'success',
      message: 'Paiement Moov Money initié. Composez *155# pour confirmer.'
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    this.log('info', 'Verifying payment', { transactionId });

    // Simulate API call
    await this.simulateApiCall();

    // Check if transaction exists
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
