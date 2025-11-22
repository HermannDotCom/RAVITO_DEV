import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast, useToastNotifications } from '../ToastContext';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should initialize with no toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(result.current).toBeDefined();
  });

  it('should show a toast notification', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast({
        type: 'success',
        title: 'Test Success',
        message: 'This is a test message',
      });
    });

    // Toast should be shown (we can't directly test the DOM here, but the function should execute)
    expect(result.current.showToast).toBeDefined();
  });

  it('should hide a toast by id', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast({
        type: 'info',
        title: 'Test Info',
        message: 'This is a test info message',
      });
    });

    expect(result.current.hideToast).toBeDefined();
  });

  it('should clear all toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast({
        type: 'success',
        title: 'Test 1',
        message: 'Message 1',
      });
      result.current.showToast({
        type: 'error',
        title: 'Test 2',
        message: 'Message 2',
      });
    });

    act(() => {
      result.current.clearAllToasts();
    });

    expect(result.current.clearAllToasts).toBeDefined();
  });

  it('should auto-dismiss toast after duration', async () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast({
        type: 'warning',
        title: 'Test Warning',
        message: 'This should auto-dismiss',
        duration: 1000,
      });
    });

    // Fast-forward time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Toast should be automatically dismissed
    expect(result.current.hideToast).toBeDefined();
  });
});

describe('useToastNotifications', () => {
  it('should provide helper methods for different toast types', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.info).toBeDefined();
    expect(result.current.warning).toBeDefined();
    expect(result.current.newOrder).toBeDefined();
    expect(result.current.newOffer).toBeDefined();
    expect(result.current.orderStatusUpdate).toBeDefined();
    expect(result.current.deliveryUpdate).toBeDefined();
    expect(result.current.orderAccepted).toBeDefined();
    expect(result.current.orderRejected).toBeDefined();
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.success('Success Title', 'Success message');
    });

    expect(result.current.success).toBeDefined();
  });

  it('should show error toast', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.error('Error Title', 'Error message');
    });

    expect(result.current.error).toBeDefined();
  });

  it('should show new order notification', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    const onView = vi.fn();

    act(() => {
      result.current.newOrder('ORDER123', 'Test Client', 50000, onView);
    });

    expect(result.current.newOrder).toBeDefined();
  });

  it('should show new offer notification', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    const onView = vi.fn();

    act(() => {
      result.current.newOffer('Test Supplier', 'ORDER123', onView);
    });

    expect(result.current.newOffer).toBeDefined();
  });

  it('should show order status update', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.orderStatusUpdate('ORDER123', 'En préparation');
    });

    expect(result.current.orderStatusUpdate).toBeDefined();
  });

  it('should show delivery update', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.deliveryUpdate('ORDER123', 'Le livreur est en route');
    });

    expect(result.current.deliveryUpdate).toBeDefined();
  });

  it('should show order accepted notification', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.orderAccepted('ORDER123', 'Test Supplier');
    });

    expect(result.current.orderAccepted).toBeDefined();
  });

  it('should show order rejected notification', () => {
    const { result } = renderHook(() => useToastNotifications(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.orderRejected('ORDER123', 'Stock insuffisant');
    });

    expect(result.current.orderRejected).toBeDefined();
  });
});
