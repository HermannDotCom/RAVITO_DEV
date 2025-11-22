import { BasePaymentProcessor } from './BasePaymentProcessor';
import { PaymentRequest, PaymentResponse, PaymentVerification } from './types';
import { normalizePhoneNumber, shouldSimulateFailure } from './utils';

/**
 * MTN Mobile Money Payment Processor Mock
 * Simulates MTN MoMo API integration for Côte d'Ivoire
 */
export class MTNMoneyProcessor extends BasePaymentProcessor {
  protected providerName = 'MTN Mobile Money';
  protected providerPrefix = 'MTN';

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

    // Validate phone number for MTN (must start with 05 or 04 in local format, or 5/4 after +225)
    const normalizedPhone = normalizePhoneNumber(request.phoneNumber!);
    const phoneDigits = normalizedPhone.replace('+225', '');
    if (!phoneDigits.startsWith('5') && !phoneDigits.startsWith('4')) {
      this.log('error', 'Invalid MTN Mobile Money phone number', { phone: phoneDigits });
      return {
        success: false,
        transactionId: '',
        reference: '',
        status: 'failed',
        message: 'Numéro MTN Mobile Money invalide. Doit commencer par 05 ou 04.',
        errorCode: 'INVALID_PHONE'
      };
    }

    // Simulate API call to MTN MoMo
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
        message: 'Échec du paiement. Solde insuffisant ou service temporairement indisponible.',
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
      message: 'Paiement MTN Mobile Money initié. Composez *133# pour confirmer.'
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
