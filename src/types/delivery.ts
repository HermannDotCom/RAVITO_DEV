/**
 * Types for Delivery Mode (Phase 4)
 * Simplified delivery interface for delivery personnel
 */

export type DeliveryStatus = 
  | 'ready_for_delivery'   // Ready to start delivery
  | 'out_for_delivery'     // Delivery in progress
  | 'arrived'              // Arrived at location
  | 'delivered';           // Successfully delivered

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: DeliveryStatus;
  
  // Client info
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientLat?: number;
  clientLng?: number;
  
  // Order details
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'orange' | 'mtn' | 'moov' | 'wave';
  
  // Delivery tracking
  assignedAt: string;
  startedAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  confirmationCode: string;
  
  // Items summary
  itemsCount: number;
  itemsSummary: string;
  
  // Packaging/consigne info
  packagingToCollect: number;
  packagingDetails: string;
}

/**
 * Statistics for delivery personnel
 */
export interface DeliveryStats {
  pending: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
}

/**
 * Filter options for delivery list
 */
export type DeliveryFilter = 'all' | 'pending' | 'in_progress' | 'completed';
