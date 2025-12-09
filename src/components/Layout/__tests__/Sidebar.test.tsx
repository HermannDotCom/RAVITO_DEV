import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import * as AuthContext from '../../../context/AuthContext';
import { User, Client, Supplier } from '../../../types';

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
    // Create a minimal user that simulates missing name field
    const userWithNoNames: Partial<User> = {
      id: '1',
      email: 'test@example.com',
      role: 'client',
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    };

    mockUseAuth.mockReturnValue({
      user: userWithNoNames as User,
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
    const supplierUser: Supplier = {
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
      coverageZone: 'Abidjan',
      availableProducts: ['biere', 'soda'],
      deliveryCapacity: 'truck',
      businessHours: '8h-18h',
      acceptedPayments: ['orange', 'mtn'],
      isAvailable: true,
      communes: [],
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
    const clientUser: Client = {
      id: '1',
      email: 'client@example.com',
      role: 'client',
      name: 'Jane Smith',
      businessName: undefined as any, // Simulating missing businessName
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
      businessHours: '9h-17h',
      preferredPayments: ['orange'],
      responsiblePerson: 'Jane Smith',
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
    const clientUser: Client = {
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
      businessHours: '9h-17h',
      preferredPayments: ['mtn'],
      responsiblePerson: 'Bob Johnson',
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
