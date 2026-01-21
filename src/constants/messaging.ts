/**
 * Messaging System Constants
 * Shared constants for consistent messaging behavior across the application
 */

import type { OrderStatus } from '../types';

/**
 * Order statuses that enable messaging for clients and suppliers
 * From 'paid' status onwards
 */
export const MESSAGING_ENABLED_STATUSES: OrderStatus[] = [
  'paid',
  'awaiting-client-validation',
  'accepted',
  'preparing',
  'delivering',
  'delivered',
  'awaiting-rating'
];

/**
 * Order statuses that enable messaging for drivers
 * Only during active delivery
 */
export const DRIVER_MESSAGING_STATUSES: OrderStatus[] = [
  'delivering'
];

/**
 * Check if messaging is enabled for a given order status
 */
export function isMessagingEnabled(status: OrderStatus): boolean {
  return MESSAGING_ENABLED_STATUSES.includes(status);
}

/**
 * Check if driver messaging is enabled for a given order status
 */
export function isDriverMessagingEnabled(status: OrderStatus): boolean {
  return DRIVER_MESSAGING_STATUSES.includes(status);
}
