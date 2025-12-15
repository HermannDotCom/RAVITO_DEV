import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePWA } from '../usePWA';

describe('usePWA Hook', () => {
  beforeEach(() => {
    // Reset DOM state
    vi.clearAllMocks();
    
    // Mock matchMedia for all tests
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.installPrompt).toBe(null);
  });

  it('should detect standalone mode', () => {
    // Mock matchMedia for standalone mode
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWA());

    expect(result.current.isStandalone).toBe(true);
    expect(result.current.isInstalled).toBe(true);
  });

  it('should detect iOS devices', () => {
    // Mock iOS user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isIOS).toBe(true);
  });

  it('should handle beforeinstallprompt event', async () => {
    const { result } = renderHook(() => usePWA());

    // Create mock event
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.prompt = vi.fn();
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    // Trigger event
    window.dispatchEvent(mockEvent);

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
      expect(result.current.installPrompt).not.toBe(null);
    });
  });

  it('should handle app installed event', async () => {
    const { result } = renderHook(() => usePWA());

    // First set up install prompt
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.prompt = vi.fn();
    window.dispatchEvent(mockEvent);

    // Then trigger installed event
    window.dispatchEvent(new Event('appinstalled'));

    await waitFor(() => {
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.isInstallable).toBe(false);
      expect(result.current.installPrompt).toBe(null);
    });
  });

  it('should return false when promptInstall is called without install prompt', async () => {
    const { result } = renderHook(() => usePWA());

    const success = await result.current.promptInstall();

    expect(success).toBe(false);
  });
});
