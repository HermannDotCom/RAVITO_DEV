import { describe, it, expect, beforeEach, vi } from 'vitest';
import { browserNotificationService } from '../browserNotificationService';

// Mock the Notification API
const mockNotification = {
  close: vi.fn(),
  onclick: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock global Notification
  global.Notification = vi.fn(() => mockNotification) as unknown as typeof Notification;
  global.Notification.permission = 'default';
  global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
});

describe('BrowserNotificationService', () => {
  describe('isSupported', () => {
    it('should return true when Notification is available', () => {
      expect(browserNotificationService.isSupported()).toBe(true);
    });

    it('should return false when Notification is not available', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - Testing undefined case
      delete global.Notification;
      
      expect(browserNotificationService.isSupported()).toBe(false);
      
      // Restore
      global.Notification = originalNotification;
    });
  });

  describe('getPermission', () => {
    it('should return current notification permission', () => {
      global.Notification.permission = 'granted';
      expect(browserNotificationService.getPermission()).toBe('granted');
      
      global.Notification.permission = 'denied';
      expect(browserNotificationService.getPermission()).toBe('denied');
      
      global.Notification.permission = 'default';
      expect(browserNotificationService.getPermission()).toBe('default');
    });

    it('should return denied when notifications not supported', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - Testing undefined case
      delete global.Notification;
      
      expect(browserNotificationService.getPermission()).toBe('denied');
      
      // Restore
      global.Notification = originalNotification;
    });
  });

  describe('requestPermission', () => {
    it('should request notification permission', async () => {
      global.Notification.permission = 'default';
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      
      const permission = await browserNotificationService.requestPermission();
      
      expect(permission).toBe('granted');
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should return granted if already granted', async () => {
      global.Notification.permission = 'granted';
      
      const permission = await browserNotificationService.requestPermission();
      
      expect(permission).toBe('granted');
    });

    it('should return denied if not supported', async () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - Testing undefined case
      delete global.Notification;
      
      const permission = await browserNotificationService.requestPermission();
      
      expect(permission).toBe('denied');
      
      // Restore
      global.Notification = originalNotification;
    });
  });

  describe('show', () => {
    it('should show a notification when permission is granted', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.show({
        title: 'Test Title',
        body: 'Test Body',
      });
      
      expect(global.Notification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
        })
      );
    });

    it('should not show notification when permission is denied', async () => {
      global.Notification.permission = 'denied';
      
      await browserNotificationService.show({
        title: 'Test Title',
        body: 'Test Body',
      });
      
      expect(global.Notification).not.toHaveBeenCalled();
    });

    it('should request permission if default', async () => {
      global.Notification.permission = 'default';
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      
      await browserNotificationService.show({
        title: 'Test Title',
        body: 'Test Body',
      });
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('showNewOrderNotification', () => {
    it('should show new order notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showNewOrderNotification('ORDER123', 'Test Client', 50000);
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Nouvelle Commande'),
        expect.objectContaining({
          body: expect.stringContaining('ORDER123'),
        })
      );
    });
  });

  describe('showNewOfferNotification', () => {
    it('should show new offer notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showNewOfferNotification('Test Supplier', 'ORDER123');
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Nouvelle Offre'),
        expect.objectContaining({
          body: expect.stringContaining('Test Supplier'),
        })
      );
    });
  });

  describe('showOrderStatusNotification', () => {
    it('should show order status notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showOrderStatusNotification('ORDER123', 'accepted', 'Acceptée');
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Mise à jour'),
        expect.objectContaining({
          body: expect.stringContaining('ORDER123'),
        })
      );
    });
  });

  describe('showDeliveryNotification', () => {
    it('should show delivery notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showDeliveryNotification('ORDER123', 'Le livreur est en route');
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('livraison'),
        expect.objectContaining({
          body: expect.stringContaining('ORDER123'),
        })
      );
    });
  });

  describe('showOrderAcceptedNotification', () => {
    it('should show order accepted notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showOrderAcceptedNotification('ORDER123', 'Test Supplier');
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Acceptée'),
        expect.objectContaining({
          body: expect.stringContaining('Test Supplier'),
        })
      );
    });
  });

  describe('showOrderRejectedNotification', () => {
    it('should show order rejected notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.showOrderRejectedNotification('ORDER123', 'Stock insuffisant');
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Refusée'),
        expect.objectContaining({
          body: expect.stringContaining('ORDER123'),
        })
      );
    });
  });

  describe('testNotification', () => {
    it('should show test notification', async () => {
      global.Notification.permission = 'granted';
      
      await browserNotificationService.testNotification();
      
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Activées'),
        expect.any(Object)
      );
    });
  });
});
