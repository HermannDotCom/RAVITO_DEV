/**
 * MVP NOTE: Premium subscription functionality is temporarily disabled.
 * Business model for MVP focuses on commission-based revenue only.
 * Commission rates are configurable via Admin > Paramètres > Paramètres financiers.
 * 
 * To reactivate subscriptions post-MVP:
 * 1. Uncomment the imports:
 *    - PremiumTierDashboard
 *    - SubscriptionManagement (if needed)
 *    - PremiumTierManagement
 *    - SubscriptionPage
 * 2. Uncomment the route cases:
 *    - Client: 'subscription' case
 *    - Supplier: 'subscription' and 'premium' cases
 *    - Admin: 'premium' case
 * 3. Uncomment the corresponding menu items in Sidebar.tsx
 * 
 * Related files (kept for future use):
 * - src/services/premiumTierService.ts
 * - src/services/subscriptionService.ts
 * - src/components/Supplier/PremiumTierDashboard.tsx
 * - src/components/Supplier/SubscriptionManagement.tsx
 * - src/components/Admin/PremiumTierManagement.tsx
 * - src/pages/Subscription/SubscriptionPage.tsx
 * - src/config/subscriptionPlans.ts
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { CommissionProvider } from './context/CommissionContext';
import { RatingProvider } from './context/RatingContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { PricingProvider } from './context/PricingContext';
import { PermissionProvider } from './context/PermissionContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { AuthScreen } from './components/Auth/AuthScreen';
import { DeactivatedAccountModal } from './components/Auth/DeactivatedAccountModal';
import { SkipLink } from './components/Accessibility/SkipLink';
import { LandingPage } from './pages/Landing';
import { CGUPage, CGVPage, MentionsLegalesPage, PolitiqueConfidentialitePage } from './pages/Legal';
import { useSimpleRouter } from './hooks/useSimpleRouter';
import { SupplierDashboard } from './components/Supplier/SupplierDashboard';
import { ProductCatalog } from './components/Client/ProductCatalog';
import { Cart } from './components/Client/Cart';
import { CheckoutForm } from './components/Client/CheckoutForm';
import { OrderTracking } from './components/Client/OrderTracking';
import { AvailableOrders } from './components/Supplier/AvailableOrders';
import { ActiveDeliveries } from './components/Supplier/ActiveDeliveries';
import { DeliveryHistory, ClaimData } from './components/Supplier/DeliveryHistory';
import { SupplierProfile } from './components/Supplier/SupplierProfile';
import { ZoneRegistration } from './components/Supplier/ZoneRegistration';
// MVP: Intelligence Dashboard disabled - Uncomment to reactivate post-MVP
// import { SupplierIntelligenceDashboard } from './components/Supplier/SupplierIntelligenceDashboard';
// MVP: Subscription management disabled - Uncomment to reactivate post-MVP
// import { SubscriptionManagement } from './components/Supplier/SubscriptionManagement';
import { SupplierTreasury } from './components/Supplier/SupplierTreasury';
import { UserManagement } from './components/Admin/UserManagement';
import { OrderManagement } from './components/Admin/OrderManagement';
import { Analytics } from './components/Admin/Analytics';
import { ZoneManagement } from './components/Admin/ZoneManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { ProductManagement } from './components/Admin/ProductManagement';
import { Treasury } from './components/Admin/Treasury';
import { CommissionsDashboard } from './components/Admin/CommissionsDashboard';
import { DataManagement } from './components/Admin/DataManagement';
import { RoleManagement } from './components/Admin/RoleManagement';
// MVP: Premium tier management disabled - Uncomment to reactivate post-MVP
// import { PremiumTierManagement } from './components/Admin/PremiumTierManagement';
import { AdminReferencePricingDashboard } from './components/Admin/Pricing/AdminReferencePricingDashboard';
import { SupplierPricingDashboard } from './components/Supplier/Pricing/SupplierPricingDashboard';
import { ClientProfile } from './components/Client/ClientProfile';
import { ClientDashboard } from './components/Client/ClientDashboard';
import { OrderHistory } from './components/Client/OrderHistory';
import { ClientTreasury } from './components/Client/ClientTreasury';
import { ContactSupport } from './components/Client/ContactSupport';
import { SupplierContactSupport } from './components/Supplier/ContactSupport';
import { KenteLoader } from './components/ui/KenteLoader';
import { TicketManagement } from './components/Admin/TicketManagement';
import { TeamPage } from './components/Team';
import { NotificationsPage } from './pages/NotificationsPage';
import { ConnectionStatusIndicator } from './components/Shared/ConnectionStatusIndicator';
import { NotificationPermissionPrompt } from './components/Shared/NotificationPermissionPrompt';
import { RatingReminder } from './components/Shared/RatingReminder';
import { SessionErrorBanner } from './components/Shared/SessionErrorBanner';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { UpdatePrompt } from './components/PWA/UpdatePrompt';
import { DeliveryModePage } from './components/Supplier/DeliveryMode/DeliveryModePage';
// MVP: Premium tier dashboard disabled - Uncomment to reactivate post-MVP
// import { PremiumTierDashboard } from './components/Supplier/PremiumTierDashboard';
// MVP: Subscription page disabled - Uncomment to reactivate post-MVP
// import { SubscriptionPage } from './pages/Subscription/SubscriptionPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useRealtimeOrders } from './hooks/useRealtimeOrders';
import { usePendingRatings } from './hooks/usePendingRatings';
import { useOrder } from './context/OrderContext';

const AppContent: React.FC = () => {
  const { user, isInitializing, sessionError, refreshSession, logout, clearSessionError } = useAuth();
  const { path, navigate } = useSimpleRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderIdToRate, setOrderIdToRate] = useState<string | null>(null);

  // Get order data for badge counts
  const { clientOrders, availableOrders, supplierActiveDeliveries } = useOrder();

  // Hook for pending ratings
  const { pendingOrders } = usePendingRatings(
    user?.id || null, 
    user?.role as 'client' | 'supplier' | undefined
  );

  // Enable realtime order notifications
  useRealtimeOrders();

  // Calculate badge counts
  const pendingClientOrders = clientOrders.filter(o => 
    ['pending', 'paid', 'accepted', 'preparing', 'delivering'].includes(o.status)
  ).length;
  const availableOrdersCount = availableOrders.length;
  const activeDeliveriesCount = supplierActiveDeliveries.length;

  // Handler for session refresh
  const handleSessionRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler for logout from session error banner
  const handleSessionLogout = async () => {
    await logout();
  };

  // Public pages routing (accessible without auth)
  if (path === '/cgu') {
    return <CGUPage onNavigate={navigate} />;
  }

  if (path === '/cgv') {
    return <CGVPage onNavigate={navigate} />;
  }

  if (path === '/mentions-legales') {
    return <MentionsLegalesPage onNavigate={navigate} />;
  }

  if (path === '/politique-confidentialite') {
    return <PolitiqueConfidentialitePage onNavigate={navigate} />;
  }

  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6 animate-pulse">
            <img 
              src="/Logo_Ravito_avec_slogan.png" 
              alt="Ravito - Le ravitaillement qui ne dort jamais" 
              className="h-32 w-auto"
            />
          </div>
          <KenteLoader size="md" text="Chargement..." />
        </div>
      </div>
    );
  }

  if (!user) {
    // Show landing page on root path when not authenticated
    if (path === '/' || path === '') {
      return <LandingPage onNavigate={navigate} />;
    }
    // For other paths (like /login, /register), show AuthScreen
    return <AuthScreen initialPath={path} />;
  }

  // Check if user account is deactivated
  if (user && !user.isActive) {
    return (
      <DeactivatedAccountModal
        userName={user.name || 'Utilisateur'}
        onContactSupport={() => {
          // For now, just logout and show message - support system requires active account
          alert('Pour contacter le support, veuillez envoyer un email à support@ravito.app en mentionnant votre adresse email et votre nom.');
          logout();
        }}
        onLogout={logout}
      />
    );
  }

  const renderMainContent = () => {
    return renderSectionContent();
  };

  const renderSectionContent = () => {
    switch (user.role) {
      case 'client':
        switch (activeSection) {
          case 'catalog':
            return <ProductCatalog />;
          case 'cart':
            return <Cart onCheckout={() => setActiveSection('checkout')} />;
          case 'checkout':
            return (
              <CheckoutForm
                onConfirm={() => setActiveSection('orders')}
                onBack={() => setActiveSection('cart')}
              />
            );
          case 'tracking':
            return <OrderTracking onComplete={() => {
              setActiveSection('orders');
            }} />;
          case 'profile':
            return <ClientProfile />;
          case 'dashboard':
            return <ClientDashboard onNavigate={setActiveSection} />;
          case 'orders':
            return <OrderHistory onNavigate={setActiveSection} initialOrderIdToRate={orderIdToRate} onOrderRated={handleOrderRated} />;
          case 'treasury':
            return <ClientTreasury />;
          case 'team':
            return <TeamPage />;
          case 'notifications':
            return <NotificationsPage />;
          // MVP: Subscription page disabled - Uncomment to reactivate post-MVP
          // case 'subscription':
          //   return <SubscriptionPage onNavigate={setActiveSection} />;
          case 'support':
            return <ContactSupport />;
          default:
            return <OrderHistory onNavigate={setActiveSection} initialOrderIdToRate={orderIdToRate} onOrderRated={handleOrderRated} />;
        }
      
      case 'supplier':
        switch (activeSection) {
          case 'zones':
            return <ZoneRegistration />;
          case 'orders':
            return (
              <AvailableOrders onNavigate={setActiveSection} />
            );
          case 'deliveries':
            return <ActiveDeliveries onNavigate={setActiveSection} />;
          case 'delivery-mode':
            return <DeliveryModePage />;
          case 'history':
            return <DeliveryHistory onNavigate={setActiveSection} onClaimRequest={setClaimData} initialOrderIdToRate={orderIdToRate} onOrderRated={handleOrderRated} />;
          case 'profile':
            return <SupplierProfile />;
          case 'treasury':
            return <SupplierTreasury />;
          case 'team':
            return <TeamPage />;
          case 'notifications':
            return <NotificationsPage />;
          // MVP: Subscription page disabled - Uncomment to reactivate post-MVP
          // case 'subscription':
          //   return <SubscriptionPage onNavigate={setActiveSection} />;
          // MVP: Premium tier dashboard disabled - Uncomment to reactivate post-MVP
          // case 'premium':
          //   return <PremiumTierDashboard />;
          case 'support':
            return (
              <SupplierContactSupport
                initialSubject={claimData?.subject}
                initialCategory={claimData?.category}
                initialMessage={claimData?.message}
                initialPriority={claimData?.priority}
                onClaimDataClear={() => setClaimData(null)}
              />
            );
          case 'pricing':
            return <SupplierPricingDashboard />;
    
          // MVP: Intelligence Dashboard disabled - Uncomment to reactivate post-MVP
          // case 'intelligence':
          //   return <SupplierIntelligenceDashboard supplierId={user.id} onNavigate={setActiveSection} />;
          // Note: Intelligence route now falls through to default (dashboard)
          default:
            return <SupplierDashboard onNavigate={setActiveSection} />;
        }
      
      case 'admin':
        switch (activeSection) {
          case 'analytics':
            return <Analytics />;
          case 'users':
            return <UserManagement />;
          case 'orders':
            return <OrderManagement />;
          case 'products':
            return <ProductManagement />;
          case 'treasury':
            return <Treasury />;
          case 'commissions':
            return <CommissionsDashboard />;
          case 'zones':
            return <ZoneManagement />;
          case 'team':
            return <TeamPage />;
          case 'roles':
            return <RoleManagement />;
          case 'data':
            return <DataManagement />;
          case 'notifications':
            return <NotificationsPage />;
          case 'settings':
            return <SystemSettings />;
          case 'pricing':
            return <AdminReferencePricingDashboard />;
          case 'tickets':
            return <TicketManagement />;
          default:
            return <Analytics />;
        }
      
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  // Handle rating from reminder
  const handleRateFromReminder = (orderId: string) => {
    // Store the orderId to open the rating modal
    setOrderIdToRate(orderId);
    // Navigate to the appropriate history section
    if (user?.role === 'client') {
      setActiveSection('orders');
    } else if (user?.role === 'supplier') {
      setActiveSection('history');
    }
  };

  // Callback to clear the orderIdToRate after it's been handled
  const handleOrderRated = () => {
    setOrderIdToRate(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Error Banner */}
      {sessionError && (
        <SessionErrorBanner
          error={sessionError}
          isRecovering={isRefreshing}
          onRefresh={handleSessionRefresh}
          onLogout={handleSessionLogout}
          onDismiss={clearSessionError}
        />
      )}
      
      <SkipLink />
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        title={undefined}
        onCartClick={() => setActiveSection('cart')}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main id="main-content" className={`flex-1 pt-16 lg:pl-64 pb-20 lg:pb-0 overflow-x-hidden ${sessionError ? 'sm:pt-14' : ''}`}>
          {renderMainContent()}
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile Only - Client and Supplier Roles */}
      {(user?.role === 'client' || user?.role === 'supplier') && (
        <BottomNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          pendingOrdersCount={user.role === 'client' ? pendingClientOrders : 0}
          availableOrdersCount={user.role === 'supplier' ? availableOrdersCount : 0}
          activeDeliveriesCount={user.role === 'supplier' ? activeDeliveriesCount : 0}
        />
      )}
      
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Rating Reminder for pending ratings */}
      {user && (user.role === 'client' || user.role === 'supplier') && pendingOrders.length > 0 && (
        <RatingReminder
          pendingOrders={pendingOrders}
          onRateOrder={handleRateFromReminder}
          userRole={user.role as 'client' | 'supplier'}
        />
      )}
      
      {/* PWA Install and Update Prompts */}
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <PermissionProvider>
            <CartProvider>
              <CommissionProvider>
                <PricingProvider>
                  <OrderProvider>
                    <RatingProvider>
                      <AppContent />
                    </RatingProvider>
                  </OrderProvider>
                </PricingProvider>
              </CommissionProvider>
            </CartProvider>
          </PermissionProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;