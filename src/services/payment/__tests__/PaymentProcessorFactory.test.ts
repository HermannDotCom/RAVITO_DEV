import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentProcessorFactory } from '../PaymentProcessorFactory';
import { OrangeMoneyProcessor } from '../OrangeMoneyProcessor';
import { MTNMoneyProcessor } from '../MTNMoneyProcessor';
import { WaveProcessor } from '../WaveProcessor';
import { MoovMoneyProcessor } from '../MoovMoneyProcessor';
import { StripeProcessor } from '../StripeProcessor';

describe('PaymentProcessorFactory', () => {
  beforeEach(() => {
    PaymentProcessorFactory.clearProcessors();
  });

  it('should return OrangeMoneyProcessor for orange payment method', () => {
    const processor = PaymentProcessorFactory.getProcessor('orange');
    expect(processor).toBeInstanceOf(OrangeMoneyProcessor);
    expect(processor.getProviderName()).toBe('Orange Money');
  });

  it('should return MTNMoneyProcessor for mtn payment method', () => {
    const processor = PaymentProcessorFactory.getProcessor('mtn');
    expect(processor).toBeInstanceOf(MTNMoneyProcessor);
    expect(processor.getProviderName()).toBe('MTN Mobile Money');
  });

  it('should return WaveProcessor for wave payment method', () => {
    const processor = PaymentProcessorFactory.getProcessor('wave');
    expect(processor).toBeInstanceOf(WaveProcessor);
    expect(processor.getProviderName()).toBe('Wave');
  });

  it('should return MoovMoneyProcessor for moov payment method', () => {
    const processor = PaymentProcessorFactory.getProcessor('moov');
    expect(processor).toBeInstanceOf(MoovMoneyProcessor);
    expect(processor.getProviderName()).toBe('Moov Money');
  });

  it('should return StripeProcessor for card payment method', () => {
    const processor = PaymentProcessorFactory.getProcessor('card');
    expect(processor).toBeInstanceOf(StripeProcessor);
    expect(processor.getProviderName()).toBe('Stripe');
  });

  it('should return same processor instance for repeated calls', () => {
    const processor1 = PaymentProcessorFactory.getProcessor('orange');
    const processor2 = PaymentProcessorFactory.getProcessor('orange');
    expect(processor1).toBe(processor2);
  });

  it('should create new instances after clearing processors', () => {
    const processor1 = PaymentProcessorFactory.getProcessor('orange');
    PaymentProcessorFactory.clearProcessors();
    const processor2 = PaymentProcessorFactory.getProcessor('orange');
    expect(processor1).not.toBe(processor2);
  });
});
