import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock all the context providers and components
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { 
      id: '1', 
      email: 'test@example.com', 
      role: 'client',
      name: 'Test User',
      phone: '1234567890',
      address: '123 Test St',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: new Date(),
    },
    isInitializing: false,
    sessionError: null,
    refreshSession: vi.fn(),
    logout: vi.fn(),
    clearSessionError: vi.fn(),
  }),
}));

vi.mock('../context/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useCart: () => ({ cart: [], addToCart: vi.fn() }),
}));

vi.mock('../context/OrderContext', () => ({
  OrderProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useOrder: () => ({ 
    clientOrders: [], 
    availableOrders: [], 
    supplierActiveDeliveries: [] 
  }),
}));

vi.mock('../context/CommissionContext', () => ({
  CommissionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../context/RatingContext', () => ({
  RatingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../hooks/useRealtimeOrders', () => ({
  useRealtimeOrders: () => {},
}));

vi.mock('../hooks/usePendingRatings', () => ({
  usePendingRatings: () => ({ pendingOrders: [] }),
}));

// Mock ClientDashboard to verify it's being rendered
vi.mock('../components/Client/ClientDashboard', () => ({
  ClientDashboard: () => <div data-testid="client-dashboard">Client Dashboard</div>,
}));

// Mock OrderHistory to verify it's being rendered
vi.mock('../components/Client/OrderHistory', () => ({
  OrderHistory: () => <div data-testid="order-history">Order History</div>,
}));

// Mock other components to avoid rendering errors
vi.mock('../components/Layout/Header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('../components/Layout/Sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

vi.mock('../components/Shared/ConnectionStatusIndicator', () => ({
  ConnectionStatusIndicator: () => null,
}));

vi.mock('../components/Shared/NotificationPermissionPrompt', () => ({
  NotificationPermissionPrompt: () => null,
}));

vi.mock('../components/Navigation/BottomNavigation', () => ({
  BottomNavigation: () => null,
}));

vi.mock('../components/Accessibility/SkipLink', () => ({
  SkipLink: () => null,
}));

describe('App Routing - Client Section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have separate routing cases for dashboard and orders', () => {
    // Read the App.tsx file to verify the routing structure
    const appContent = readFileSync(
      join(__dirname, '../App.tsx'),
      'utf-8'
    );

    // Verify that ClientDashboard is imported
    expect(appContent).toContain("import { ClientDashboard } from './components/Client/ClientDashboard'");

    // Verify that the dashboard case returns ClientDashboard
    expect(appContent).toContain("case 'dashboard':");
    expect(appContent).toContain("<ClientDashboard onNavigate={setActiveSection} />");

    // Verify that the orders case returns OrderHistory (separate from dashboard)
    expect(appContent).toContain("case 'orders':");
    expect(appContent).toContain("<OrderHistory");

    // Verify they are NOT combined (no "case 'dashboard':\n          case 'orders':")
    const combinedCasePattern = /case 'dashboard':\s*case 'orders':/;
    expect(appContent).not.toMatch(combinedCasePattern);
  });
});
