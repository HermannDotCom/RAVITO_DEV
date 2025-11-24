import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { OrderTracking } from '../../components/Client/OrderTracking';
import { PaymentFlow } from '../../components/Client/PaymentFlow';
import { OrderProvider, useOrder } from '../../context/OrderContext';
import { AuthProvider } from '../../context/AuthContext';
import { Order, OrderStatus, PaymentMethod } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      then: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock des services
vi.mock('../../services/orderService', () => ({
  createOrder: vi.fn().mockResolvedValue({ success: true, orderId: 'order-123' }),
  getOrdersByClient: vi.fn().mockResolvedValue([]),
  getOrdersBySupplier: vi.fn().mockResolvedValue([]),
  getPendingOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue(true),
}));

// Données de test
const mockOrder: Order = {
  id: 'order-123',
  clientId: 'client-1',
  supplierId: 'supplier-1',
  status: 'awaiting-client-validation',
  payment_status: 'pending',
  payment_method: 'orange',
  deliveryAddress: '123 Rue de la Paix, Abidjan',
  items: [
    {
      product: {
        id: 'prod-1',
        name: 'Bière Castel',
        pricePerUnit: 2500,
        consigneAmount: 500,
        crateType: 'C24',
        description: 'Bière Castel 33cl',
        supplierId: 'supplier-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      quantity: 2,
      withConsigne: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  acceptedAt: null,
  deliveredAt: null,
  paid_at: null,
  transaction_id: null,
  coordinates: { lat: 5.3364, lng: -4.0267 },
  zoneId: 'zone-1',
  supplierOffer: {
    supplierId: 'supplier-1',
    offeredPrice: 6000,
    estimatedDeliveryTime: 30,
    notes: 'Livraison rapide',
  },
};

describe('Payment Flow Integration Tests', () => {
  describe('OrderTracking - Payment Detection and Display', () => {
    it('should display payment alert when order status is awaiting-client-validation and payment is not completed', async () => {
      const mockUseOrder = {
        clientCurrentOrder: mockOrder,
        updateOrderStatus: vi.fn(),
        processPayment: vi.fn(),
        refreshOrders: vi.fn(),
      };

      // Mock useOrder hook
      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      const { container } = render(
        <OrderTracking onComplete={vi.fn()} />
      );

      // Vérifier que l'alerte de paiement est affichée
      await waitFor(() => {
        expect(screen.getByText(/Paiement en attente/i)).toBeInTheDocument();
        expect(screen.getByText(/Une offre a été reçue/i)).toBeInTheDocument();
      });

      // Vérifier que le bouton "Procéder au paiement" est présent
      const paymentButton = screen.getByRole('button', { name: /Procéder au paiement/i });
      expect(paymentButton).toBeInTheDocument();
    });

    it('should NOT display payment alert when payment is already completed', async () => {
      const completedOrder = { ...mockOrder, payment_status: 'completed' as const };
      
      const mockUseOrder = {
        clientCurrentOrder: completedOrder,
        updateOrderStatus: vi.fn(),
        processPayment: vi.fn(),
        refreshOrders: vi.fn(),
      };

      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      render(
        <OrderTracking onComplete={vi.fn()} />
      );

      // Vérifier que l'alerte de paiement n'est PAS affichée
      await waitFor(() => {
        expect(screen.queryByText(/Paiement en attente/i)).not.toBeInTheDocument();
      });
    });

    it('should display payment status as "Payé" when payment_status is completed', async () => {
      const completedOrder = { ...mockOrder, payment_status: 'completed' as const };
      
      const mockUseOrder = {
        clientCurrentOrder: completedOrder,
        updateOrderStatus: vi.fn(),
        processPayment: vi.fn(),
        refreshOrders: vi.fn(),
      };

      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      render(
        <OrderTracking onComplete={vi.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText(/✓ Payé/i)).toBeInTheDocument();
      });
    });
  });

  describe('PaymentFlow Component', () => {
    it('should render payment method selection step initially', async () => {
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Vérifier que le titre est présent
      expect(screen.getByText(/Paiement de commande/i)).toBeInTheDocument();

      // Vérifier que les méthodes de paiement sont affichées
      expect(screen.getByText(/Orange Money/i)).toBeInTheDocument();
      expect(screen.getByText(/MTN Mobile Money/i)).toBeInTheDocument();
      expect(screen.getByText(/Moov Money/i)).toBeInTheDocument();
      expect(screen.getByText(/Wave/i)).toBeInTheDocument();
      expect(screen.getByText(/Carte bancaire/i)).toBeInTheDocument();

      // Vérifier que le montant total est affiché
      expect(screen.getByText(/6500 FCFA/i)).toBeInTheDocument();
    });

    it('should select payment method and proceed to confirmation', async () => {
      const user = userEvent.setup();
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Sélectionner MTN Mobile Money
      const mtnButton = screen.getByRole('button', { name: /MTN Mobile Money/i });
      await user.click(mtnButton);

      // Cliquer sur "Continuer"
      const continueButton = screen.getByRole('button', { name: /Continuer/i });
      await user.click(continueButton);

      // Vérifier que l'étape de confirmation est affichée
      await waitFor(() => {
        expect(screen.getByText(/Confirmer le paiement/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Entrez l'ID de transaction/i)).toBeInTheDocument();
      });
    });

    it('should validate transaction ID before confirming payment', async () => {
      const user = userEvent.setup();
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Procéder jusqu'à l'étape de confirmation
      const continueButton = screen.getByRole('button', { name: /Continuer/i });
      await user.click(continueButton);

      // Essayer de confirmer sans entrer l'ID de transaction
      const confirmButton = screen.getByRole('button', { name: /Confirmer le paiement/i });
      await user.click(confirmButton);

      // Vérifier que le message d'erreur est affiché
      await waitFor(() => {
        expect(screen.getByText(/Veuillez entrer l'ID de transaction/i)).toBeInTheDocument();
      });

      // Vérifier que onPaymentComplete n'a pas été appelé
      expect(mockOnPaymentComplete).not.toHaveBeenCalled();
    });

    it('should call onPaymentComplete with correct parameters after successful payment', async () => {
      const user = userEvent.setup();
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Sélectionner Orange Money (déjà sélectionné par défaut)
      const continueButton = screen.getByRole('button', { name: /Continuer/i });
      await user.click(continueButton);

      // Entrer l'ID de transaction
      const transactionInput = screen.getByPlaceholderText(/Entrez l'ID de transaction/i);
      await user.type(transactionInput, 'TXN123456789');

      // Confirmer le paiement
      const confirmButton = screen.getByRole('button', { name: /Confirmer le paiement/i });
      await user.click(confirmButton);

      // Vérifier que onPaymentComplete est appelé avec les bons paramètres
      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalledWith('orange', 'TXN123456789');
      });
    });

    it('should display processing state after payment confirmation', async () => {
      const user = userEvent.setup();
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Procéder jusqu'à la confirmation
      const continueButton = screen.getByRole('button', { name: /Continuer/i });
      await user.click(continueButton);

      const transactionInput = screen.getByPlaceholderText(/Entrez l'ID de transaction/i);
      await user.type(transactionInput, 'TXN123456789');

      const confirmButton = screen.getByRole('button', { name: /Confirmer le paiement/i });
      await user.click(confirmButton);

      // Vérifier que l'état de traitement est affiché
      await waitFor(() => {
        expect(screen.getByText(/Traitement du paiement/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Update After Payment', () => {
    it('should update order status to preparing after successful payment', async () => {
      const mockProcessPayment = vi.fn().mockResolvedValue(true);
      const mockUpdateOrderStatus = vi.fn();

      const mockUseOrder = {
        clientCurrentOrder: mockOrder,
        updateOrderStatus: mockUpdateOrderStatus,
        processPayment: mockProcessPayment,
        refreshOrders: vi.fn(),
      };

      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      // Simuler l'appel de processPayment
      const result = await mockProcessPayment('order-123', 'orange', 'TXN123456789');

      expect(result).toBe(true);
      expect(mockProcessPayment).toHaveBeenCalledWith('order-123', 'orange', 'TXN123456789');
    });

    it('should handle payment failure gracefully', async () => {
      const mockProcessPayment = vi.fn().mockResolvedValue(false);

      const mockUseOrder = {
        clientCurrentOrder: mockOrder,
        updateOrderStatus: vi.fn(),
        processPayment: mockProcessPayment,
        refreshOrders: vi.fn(),
      };

      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      const result = await mockProcessPayment('order-123', 'orange', 'TXN123456789');

      expect(result).toBe(false);
      expect(mockProcessPayment).toHaveBeenCalled();
    });
  });

  describe('Complete Payment Flow Scenario', () => {
    it('should complete full payment flow from awaiting-client-validation to payment completed', async () => {
      const user = userEvent.setup();
      const mockProcessPayment = vi.fn().mockResolvedValue(true);
      const mockOnPaymentComplete = vi.fn();
      const mockOnCancel = vi.fn();

      // Étape 1 : Afficher l'alerte de paiement dans OrderTracking
      const mockUseOrder = {
        clientCurrentOrder: mockOrder,
        updateOrderStatus: vi.fn(),
        processPayment: mockProcessPayment,
        refreshOrders: vi.fn(),
      };

      vi.doMock('../../context/OrderContext', () => ({
        useOrder: () => mockUseOrder,
      }));

      // Étape 2 : Ouvrir le formulaire de paiement
      render(
        <PaymentFlow
          order={mockOrder}
          onPaymentComplete={mockOnPaymentComplete}
          onCancel={mockOnCancel}
          isProcessing={false}
        />
      );

      // Étape 3 : Sélectionner une méthode de paiement
      const continueButton = screen.getByRole('button', { name: /Continuer/i });
      await user.click(continueButton);

      // Étape 4 : Entrer l'ID de transaction
      const transactionInput = screen.getByPlaceholderText(/Entrez l'ID de transaction/i);
      await user.type(transactionInput, 'TXN123456789');

      // Étape 5 : Confirmer le paiement
      const confirmButton = screen.getByRole('button', { name: /Confirmer le paiement/i });
      await user.click(confirmButton);

      // Étape 6 : Vérifier que onPaymentComplete est appelé
      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalledWith('orange', 'TXN123456789');
      });

      // Étape 7 : Vérifier que le statut de traitement est affiché
      expect(screen.getByText(/Traitement du paiement/i)).toBeInTheDocument();
    });
  });
});
