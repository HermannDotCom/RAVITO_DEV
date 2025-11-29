/**
 * Browser Notification Service
 * Handles browser push notifications using the Notification API
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  onClick?: () => void;
}

class BrowserNotificationService {
  private static readonly ICON_URL = '/icon-192x192.png';
  private static readonly BADGE_URL = '/badge-72x72.png';

  /**
   * Check if browser notifications are supported
   */
  public isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.getPermission() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   */
  public async show(options: BrowserNotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return;
    }

    const permission = this.getPermission();
    
    if (permission === 'denied') {
      console.warn('Notification permission denied');
      return;
    }

    if (permission === 'default') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || BrowserNotificationService.ICON_URL,
        badge: options.badge || BrowserNotificationService.BADGE_URL,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 10 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show notification for new order (for suppliers)
   */
  public async showNewOrderNotification(orderNumber: string, clientName: string, amount: number): Promise<void> {
    await this.show({
      title: '🔔 Nouvelle Commande !',
      body: `Commande #${orderNumber} de ${clientName} - ${amount.toLocaleString('fr-FR')} FCFA`,
      tag: `order-${orderNumber}`,
      requireInteraction: true,
      data: { type: 'new_order', orderNumber }
    });
  }

  /**
   * Show notification for new supplier offer (for clients)
   */
  public async showNewOfferNotification(supplierName: string, orderNumber: string): Promise<void> {
    await this.show({
      title: '📦 Nouvelle Offre Reçue !',
      body: `${supplierName} a fait une offre pour votre commande #${orderNumber}`,
      tag: `offer-${orderNumber}`,
      requireInteraction: true,
      data: { type: 'new_offer', orderNumber }
    });
  }

  /**
   * Show notification for order status change
   */
  public async showOrderStatusNotification(orderNumber: string, status: string, statusLabel: string): Promise<void> {
    const emoji = this.getStatusEmoji(status);
    await this.show({
      title: `${emoji} Mise à jour de commande`,
      body: `Commande #${orderNumber} : ${statusLabel}`,
      tag: `order-status-${orderNumber}`,
      data: { type: 'order_status', orderNumber, status }
    });
  }

  /**
   * Show notification for delivery update
   */
  public async showDeliveryNotification(orderNumber: string, message: string): Promise<void> {
    await this.show({
      title: '🚚 Mise à jour de livraison',
      body: `Commande #${orderNumber} : ${message}`,
      tag: `delivery-${orderNumber}`,
      data: { type: 'delivery_update', orderNumber }
    });
  }

  /**
   * Show notification for order acceptance
   */
  public async showOrderAcceptedNotification(orderNumber: string, supplierName: string): Promise<void> {
    await this.show({
      title: '✅ Commande Acceptée !',
      body: `${supplierName} a accepté votre commande #${orderNumber}`,
      tag: `accepted-${orderNumber}`,
      data: { type: 'order_accepted', orderNumber }
    });
  }

  /**
   * Show notification for order rejection
   */
  public async showOrderRejectedNotification(orderNumber: string, reason?: string): Promise<void> {
    await this.show({
      title: '❌ Commande Refusée',
      body: reason 
        ? `Commande #${orderNumber} refusée : ${reason}`
        : `Commande #${orderNumber} a été refusée`,
      tag: `rejected-${orderNumber}`,
      requireInteraction: true,
      data: { type: 'order_rejected', orderNumber }
    });
  }

  /**
   * Get emoji for order status
   */
  private getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'pending': '⏳',
      'accepted': '✅',
      'preparing': '👨‍🍳',
      'delivering': '🚚',
      'delivered': '✅',
      'cancelled': '❌',
      'awaiting-client-validation': '🔔'
    };
    return emojiMap[status] || '📦';
  }

  /**
   * Test notification
   */
  public async testNotification(): Promise<void> {
    await this.show({
      title: '🎉 Notifications Activées !',
      body: 'Vous recevrez maintenant des notifications en temps réel',
      tag: 'test-notification'
    });
  }
}

// Export singleton instance
export const browserNotificationService = new BrowserNotificationService();
