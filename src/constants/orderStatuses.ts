import { OrderStatus } from '../types';

/**
 * Order status constants for consistent filtering across the application
 */

/** Order statuses that represent completed orders */
export const COMPLETED_ORDER_STATUSES: OrderStatus[] = ['delivered', 'completed'];

/** Order statuses that represent pending/active orders */
export const PENDING_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'pending-offers',
  'offers-received',
  'awaiting-payment',
  'paid',
  'awaiting-client-validation',
  'accepted',
  'preparing',
  'delivering',
  'awaiting-rating'
];

/** Order statuses that represent cancelled/rejected orders */
export const CANCELLED_ORDER_STATUSES: OrderStatus[] = ['cancelled'];

/** Order statuses where supplier is actively working on the order */
export const ACTIVE_DELIVERY_STATUSES: OrderStatus[] = [
  'accepted',
  'preparing',
  'delivering'
];
