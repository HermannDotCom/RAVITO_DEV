import { PaymentMethod } from '../../types';
import { PaymentProcessor } from './types';
import { OrangeMoneyProcessor } from './OrangeMoneyProcessor';
import { MTNMoneyProcessor } from './MTNMoneyProcessor';
import { WaveProcessor } from './WaveProcessor';
import { MoovMoneyProcessor } from './MoovMoneyProcessor';
import { StripeProcessor } from './StripeProcessor';

/**
 * Payment Processor Factory
 * Creates the appropriate payment processor based on payment method
 */
export class PaymentProcessorFactory {
  private static processors: Map<PaymentMethod, PaymentProcessor> = new Map();

  /**
   * Get payment processor for a specific payment method
   */
  static getProcessor(paymentMethod: PaymentMethod): PaymentProcessor {
    // Return existing processor or create new one
    if (!this.processors.has(paymentMethod)) {
      this.processors.set(paymentMethod, this.createProcessor(paymentMethod));
    }

    return this.processors.get(paymentMethod)!;
  }

  /**
   * Create a new payment processor instance
   */
  private static createProcessor(paymentMethod: PaymentMethod): PaymentProcessor {
    switch (paymentMethod) {
      case 'orange':
        return new OrangeMoneyProcessor();
      case 'mtn':
        return new MTNMoneyProcessor();
      case 'wave':
        return new WaveProcessor();
      case 'moov':
        return new MoovMoneyProcessor();
      case 'card':
        return new StripeProcessor();
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  /**
   * Clear all processor instances (useful for testing)
   */
  static clearProcessors(): void {
    this.processors.clear();
  }
}
