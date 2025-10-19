import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider, useOrder } from './context/OrderContext';
import { CommissionProvider } from './context/CommissionContext';
import { RatingProvider } from './context/RatingContext';
import { NotificationProvider } from './context/NotificationContext';
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
import { OrderConfirmation } from './components/Client/OrderConfirmation';
import { PaymentModal } from './components/Client/PaymentModal';
import { ContactExchange } from './components/Client/ContactExchange';
import { SupplierNotification } from './components/Supplier/SupplierNotification';
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

const AppContent: React.FC = () => {
  const { user, isInitializing } = useAuth();
  const { currentOrder, clientCurrentOrder, orderStep, supplierOffer, acceptSupplierOffer, rejectSupplierOffer, cancelOrder, confirmPayment, setOrderStep, updateDeliveryTime } = useOrder();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showRating, setShowRating] = useState(false);

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

    // Handle order flow overlays
    if (user?.role === 'client' && clientCurrentOrder && orderStep === 'offer-received' && supplierOffer) {
      return (
        <>
          {activeSection === 'dashboard' ? (
            user.role === 'client' ? <ClientDashboard onNavigate={setActiveSection} /> :
            user.role === 'supplier' ? <SupplierDashboard onNavigate={setActiveSection} /> :
            <AdminDashboard />
          ) : (
            renderSectionContent()
          )}
          <OrderConfirmation
            onAccept={acceptSupplierOffer}
            onReject={rejectSupplierOffer}
            onCancel={cancelOrder}
          />
        </>
      );
    }

    if (user?.role === 'client' && clientCurrentOrder && orderStep === 'payment') {
      return (
        <>
          {activeSection === 'dashboard' ? (
            user.role === 'client' ? <ClientDashboard onNavigate={setActiveSection} /> :
            user.role === 'supplier' ? <SupplierDashboard onNavigate={setActiveSection} /> :
            <AdminDashboard />
          ) : (
            renderSectionContent()
          )}
          <PaymentModal
            amount={clientCurrentOrder.totalAmount}
            paymentMethod={clientCurrentOrder.paymentMethod}
            onSuccess={confirmPayment}
            onCancel={() => setOrderStep('offer-received')}
          />
        </>
      );
    }

    if (user?.role === 'client' && clientCurrentOrder && orderStep === 'contact-exchange') {
      return (
        <>
          {activeSection === 'dashboard' ? (
            user.role === 'client' ? <ClientDashboard onNavigate={setActiveSection} /> :
            user.role === 'supplier' ? <SupplierDashboard onNavigate={setActiveSection} /> :
            <AdminDashboard />
          ) : (
            renderSectionContent()
          )}
          <ContactExchange
            onContinue={() => setOrderStep('tracking')}
          />
        </>
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
                onConfirm={() => setActiveSection('tracking')}
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
          default:
            return <OrderHistory onNavigate={setActiveSection} />;
        }
      
      case 'supplier':
        switch (activeSection) {
          case 'zones':
            return <ZoneRegistration />;
          case 'orders':
            return (
              <>
                <AvailableOrders onNavigate={setActiveSection} />
                {currentOrder && orderStep === 'contact-exchange' && (
                  <SupplierNotification
                    order={currentOrder}
                    onContinue={() => setOrderStep('tracking')}
                  />
                )}
              </>
            );
          case 'deliveries':
            return <ActiveDeliveries onNavigate={setActiveSection} />;
          case 'history':
            return <DeliveryHistory />;
          case 'profile':
            return <SupplierProfile />;
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
          case 'data':
            return <DataManagement />;
          case 'settings':
            return <SystemSettings />;
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
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <CommissionProvider>
            <OrderProvider>
              <RatingProvider>
                <AppContent />
              </RatingProvider>
            </OrderProvider>
          </CommissionProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;