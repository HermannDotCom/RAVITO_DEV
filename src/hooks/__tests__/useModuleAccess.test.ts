import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModuleAccess } from '../useModuleAccess';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      role: 'client',
      email: 'test@example.com',
      name: 'Test User',
    },
  })),
}));

describe('useModuleAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useModuleAccess());
    
    expect(result.current.isLoading).toBe(true);
  });

  it('should return hasAccess function', () => {
    const { result } = renderHook(() => useModuleAccess());
    
    expect(typeof result.current.hasAccess).toBe('function');
  });

  it('should return refreshPermissions function', () => {
    const { result } = renderHook(() => useModuleAccess());
    
    expect(typeof result.current.refreshPermissions).toBe('function');
  });

  it('should return helper properties', () => {
    const { result } = renderHook(() => useModuleAccess());
    
    expect(result.current).toHaveProperty('isOwner');
    expect(result.current).toHaveProperty('isSuperAdmin');
    expect(result.current).toHaveProperty('availableModules');
  });

  it('should allow access during loading to prevent flash', () => {
    const { result } = renderHook(() => useModuleAccess());
    
    // During loading, hasAccess should return true
    expect(result.current.hasAccess('any-module')).toBe(true);
  });
});

describe('useModuleAccess - Fallback Mode', () => {
  it('should handle missing database tables gracefully', async () => {
    const { result } = renderHook(() => useModuleAccess());
    
    // Should not throw error
    expect(() => result.current.hasAccess('dashboard')).not.toThrow();
  });
});
