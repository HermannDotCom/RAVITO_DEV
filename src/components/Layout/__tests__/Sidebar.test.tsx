import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import * as AuthContext from '../../../context/AuthContext';
import { User } from '../../../types';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeSection: 'dashboard',
    onSectionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle user with undefined businessName and name', () => {
    const userWithNoNames: User = {
      id: '1',
      email: 'test@example.com',
      role: 'client',
      name: undefined as any, // Simulating undefined name
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      user: userWithNoNames,
      session: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      isInitializing: false,
      sessionError: null,
      refreshSession: vi.fn(),
      clearSessionError: vi.fn(),
      setSessionError: vi.fn(),
    });

    render(<Sidebar {...defaultProps} />);

    // Should display fallback "U" for avatar
    expect(screen.getByText('U')).toBeInTheDocument();
    // Should display fallback "Utilisateur" for name
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
  });

  it('should handle supplier with businessName defined', () => {
    const supplierUser: User & { businessName: string } = {
      id: '1',
      email: 'supplier@example.com',
      role: 'supplier',
      name: 'John Doe',
      businessName: 'Test Business',
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      user: supplierUser,
      session: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      isInitializing: false,
      sessionError: null,
      refreshSession: vi.fn(),
      clearSessionError: vi.fn(),
      setSessionError: vi.fn(),
    });

    render(<Sidebar {...defaultProps} />);

    // Should display first letter of business name
    expect(screen.getByText('T')).toBeInTheDocument();
    // Should display business name
    expect(screen.getByText('Test Business')).toBeInTheDocument();
  });

  it('should handle client with undefined businessName but defined name', () => {
    const clientUser: User & { businessName?: string } = {
      id: '1',
      email: 'client@example.com',
      role: 'client',
      name: 'Jane Smith',
      businessName: undefined,
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      user: clientUser,
      session: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      isInitializing: false,
      sessionError: null,
      refreshSession: vi.fn(),
      clearSessionError: vi.fn(),
      setSessionError: vi.fn(),
    });

    render(<Sidebar {...defaultProps} />);

    // Should display first letter of name
    expect(screen.getByText('J')).toBeInTheDocument();
    // Should display name
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle client with empty businessName', () => {
    const clientUser: User & { businessName: string } = {
      id: '1',
      email: 'client@example.com',
      role: 'client',
      name: 'Bob Johnson',
      businessName: '',
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      user: clientUser,
      session: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      isInitializing: false,
      sessionError: null,
      refreshSession: vi.fn(),
      clearSessionError: vi.fn(),
      setSessionError: vi.fn(),
    });

    render(<Sidebar {...defaultProps} />);

    // Should fall back to name when businessName is empty
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });
});
