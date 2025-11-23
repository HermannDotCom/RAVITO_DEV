import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider, useOrder } from './context/OrderContext';
import { CommissionProvider } from './context/CommissionContext';
import { RatingProvider } from './context/RatingContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { AuthScreen } from './components/Auth/AuthScreen';
import { SkipLink } from './components/Accessibility/SkipLink';
import { ClientDashboard } from './components/Client/ClientDashboard';
import { SupplierDashboard } from './components/Supplier/SupplierDashboard';
import { ProductCatalog } from './components/Client/ProductCatalog';
import { Cart } from './components/Client/Cart';
import { CheckoutForm } from './components/Client/CheckoutForm';
import { OrderTracking } from './components/Client/OrderTracking';
import { RatingForm } from './components/Client/RatingForm';
import { AvailableOrders } from './components/Supplier/AvailableOrders';
import { ActiveDeliveries } from './components/Supplier/ActiveDeliveries';
import { DeliveryHistory } from './components/Supplier/DeliveryHistory';
import { SupplierProfile } from './components/Supplier/SupplierProfile';
import { ZoneRegistration } from './components/Supplier/ZoneRegistration';
import { UserManagement } from './components/Admin/UserManagement';
import { OrderManagement } from './components/Admin/OrderManagement';
import { Analytics } from './components/Admin/Analytics';
import { ZoneManagement } from './components/Admin/ZoneManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { ProductManagement } from './components/Admin/ProductManagement';
import { Treasury } from './components/Admin/Treasury';
import { DataManagement } from './components/Admin/DataManagement';
import { ClientProfile } from './components/Client/ClientProfile';
import { OrderHistory } from './components/Client/OrderHistory';
import { ClientRatingForm } from './components/Client/ClientRatingForm';
import { ContactSupport } from './components/Client/ContactSupport';
import { SupplierContactSupport } from './components/Supplier/ContactSupport';
import { TicketManagement } from './components/Admin/TicketManagement';
import { ConnectionStatusIndicator } from './components/Shared/ConnectionStatusIndicator';
import { NotificationPermissionPrompt } from './components/Shared/NotificationPermissionPrompt';
import { useRealtimeOrders } from './hooks/useRealtimeOrders';

const AppContent: React.FC = () => {
  const { user, isInitializing } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showRating, setShowRating] = useState(false);

  // Enable realtime order notifications
  useRealtimeOrders();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <span className="text-white font-bold text-2xl">DN</span>
          </div>
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderMainContent = () => {
    if (showRating) {
      return (
        <RatingForm
          supplierName="Dépôt du Plateau"
          onSubmit={() => {
            setShowRating(false);
            setActiveSection('dashboard');
          }}
        />
      );
    }

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
              setShowRating(true);
            }} />;
          case 'profile':
            return <ClientProfile />;
          case 'orders':
            return <OrderHistory onNavigate={setActiveSection} />;
          case 'support':
            return <ContactSupport />;
          default:
            return <OrderHistory onNavigate={setActiveSection} />;
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
          case 'history':
            return <DeliveryHistory />;
          case 'profile':
            return <SupplierProfile />;
          case 'premium':
            return <PremiumTierDashboard />;
          case 'support':
            return <SupplierContactSupport />;
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
          case 'zones':
            return <ZoneManagement />;
          case 'premium':
            return <PremiumTierManagement />;
          case 'data':
            return <DataManagement />;
          case 'settings':
            return <SystemSettings />;
          case 'tickets':
            return <TicketManagement />;
          default:
            return <Analytics />;
        }
      
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink />
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        title={showRating ? 'Évaluation' : undefined}
        onCartClick={() => setActiveSection('cart')}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main id="main-content" className="flex-1 lg:ml-0">
          {renderMainContent()}
        </main>
      </div>
      
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <CartProvider>
            <CommissionProvider>
              <OrderProvider>
                <RatingProvider>
                  <AppContent />
                </RatingProvider>
              </OrderProvider>
            </CommissionProvider>
          </CartProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;