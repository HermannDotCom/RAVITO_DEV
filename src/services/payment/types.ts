import { PaymentMethod } from '../../types';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message?: string;
  errorCode?: string;
}

export interface PaymentVerification {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  timestamp: Date;
}

export interface PaymentProcessor {
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<PaymentVerification>;
  getProviderName(): string;
}
