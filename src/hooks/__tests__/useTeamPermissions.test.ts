import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTeamPermissions } from '../useTeamPermissions';

// Mock dependencies
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

vi.mock('../useModuleAccess', () => ({
  useModuleAccess: vi.fn(() => ({
    availableModules: [
      {
        id: '1',
        key: 'dashboard',
        name: 'Accueil',
        description: 'Dashboard principal',
        icon: '🏠',
        interface: 'client',
        isOwnerOnly: false,
        isSuperAdminOnly: false,
        isAlwaysAccessible: true,
        displayOrder: 0,
      },
      {
        id: '2',
        key: 'orders',
        name: 'Commandes',
        description: 'Gestion des commandes',
        icon: '📦',
        interface: 'client',
        isOwnerOnly: false,
        isSuperAdminOnly: false,
        isAlwaysAccessible: false,
        displayOrder: 1,
      },
    ],
    isOwner: true,
  })),
}));

vi.mock('../useUserPermissions', () => ({
  useUserPermissions: vi.fn(() => ({
    memberPermissions: new Map(),
    isLoading: false,
    error: null,
    updatePermission: vi.fn(() => Promise.resolve(true)),
    updateMultiplePermissions: vi.fn(() => Promise.resolve(true)),
    loadMemberPermissions: vi.fn(() => Promise.resolve()),
    loadAllMembersPermissions: vi.fn(() => Promise.resolve()),
    canManagePermissions: true,
  })),
}));

describe('useTeamPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available modules', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(result.current.availableModules).toHaveLength(2);
    expect(result.current.availableModules[0].key).toBe('dashboard');
  });

  it('should return member permissions map', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(result.current.memberPermissions).toBeInstanceOf(Map);
  });

  it('should provide updateMemberPermission function', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(typeof result.current.updateMemberPermission).toBe('function');
  });

  it('should provide bulkUpdatePermissions function', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(typeof result.current.bulkUpdatePermissions).toBe('function');
  });

  it('should provide loadMemberPermissions function', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(typeof result.current.loadMemberPermissions).toBe('function');
  });

  it('should provide loadAllPermissions function', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(typeof result.current.loadAllPermissions).toBe('function');
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return saving state', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(result.current.isSaving).toBe(false);
  });

  it('should return canManagePermissions flag', () => {
    const { result } = renderHook(() => useTeamPermissions('test-org-id'));
    
    expect(result.current.canManagePermissions).toBe(true);
  });
});
