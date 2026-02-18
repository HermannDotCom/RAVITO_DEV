import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
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
import { LandingPageGestion } from './pages/Landing';
import { CGUPage, CGVPage, MentionsLegalesPage, PolitiqueConfidentialitePage } from './pages/Legal';
import { useSimpleRouter } from './hooks/useSimpleRouter';
import { SupplierProfile } from './components/Supplier/SupplierProfile';
import { UserManagement } from './components/Admin/UserManagement';
import { ZoneManagement } from './components/Admin/ZoneManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { SuperAdminDashboard } from './components/Admin/SuperAdminDashboard';
import { DataManagement } from './components/Admin/DataManagement';
import { RoleManagement } from './components/Admin/RoleManagement';
import { ClientProfile } from './components/Client/ClientProfile';
import { ActivityPage } from './components/Client/Activity/ActivityPage';
import { SupplierContactSupport } from './components/Supplier/ContactSupport';
import { KenteLoader } from './components/ui/KenteLoader';
import { TicketManagement } from './components/Admin/TicketManagement';
import { TeamPage } from './components/Team';
import { CommercialActivityPage } from './components/Commercial';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotificationPermissionPrompt } from './components/Shared/NotificationPermissionPrompt';
import { SessionErrorBanner } from './components/Shared/SessionErrorBanner';
import { ConnectionStatusIndicator } from './components/Shared/ConnectionStatusIndicator';
import { OfflineBanner } from './components/Shared/OfflineBanner';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { UpdatePrompt } from './components/PWA/UpdatePrompt';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SubscriptionManagementPage } from './components/Admin/SubscriptionManagement';
import { RavitoGestionSubscription } from './pages/RavitoGestionSubscription';
import { SubscriptionGuard } from './components/Subscription/SubscriptionGuard';
import { ContactSupport } from './components/Client/ContactSupport';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ClientGuidePage } from './pages/Guide/ClientGuide';

const AppContent: React.FC = () => {
  const { user, isInitializing, sessionError, refreshSession, logout, clearSessionError } = useAuth();
  const { path, navigate } = useSimpleRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('activity'); // Default for client
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      return <LandingPageGestion onNavigate={navigate} />;
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
          alert('Pour contacter le support, veuillez envoyer un email à support@ravito.ci en mentionnant votre adresse email et votre nom.');
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
          case 'profile':
            return <ClientProfile />;
          case 'support':
            return <ContactSupport />;
          case 'ravito-gestion-subscription':
            return <RavitoGestionSubscription onSectionChange={setActiveSection} />;
          case 'activity':
            return (
              <SubscriptionGuard onSectionChange={setActiveSection}>
                <ActivityPage />
              </SubscriptionGuard>
            );
          case 'team':
            return (
              <SubscriptionGuard onSectionChange={setActiveSection}>
                <TeamPage />
              </SubscriptionGuard>
            );
          case 'commercial-activity':
            return (
              <SubscriptionGuard onSectionChange={setActiveSection}>
                <CommercialActivityPage />
              </SubscriptionGuard>
            );
          case 'notifications':
            return (
              <SubscriptionGuard onSectionChange={setActiveSection}>
                <NotificationsPage />
              </SubscriptionGuard>
            );
          case 'guide':
            return <ClientGuidePage />;
          default:
            return (
              <SubscriptionGuard onSectionChange={setActiveSection}>
                <ActivityPage />
              </SubscriptionGuard>
            );
        }

      case 'supplier':
        switch (activeSection) {
          case 'profile':
            return <SupplierProfile />;
          case 'support':
            return <SupplierContactSupport />;
          case 'team':
            return <TeamPage />;
          case 'commercial-activity':
            return <CommercialActivityPage />;
          case 'notifications':
            return <NotificationsPage />;
          default:
            return <SupplierProfile />;
        }
      
      case 'admin':
        switch (activeSection) {
          case 'super-dashboard':
            return <SuperAdminDashboard />;
          case 'users':
            return <UserManagement />;
          case 'products':
            return <div className="p-8"><p className="text-gray-600">Catalogue Produits - Module Marketplace à venir le 14/03/2026</p></div>;
          case 'zones':
            return <ZoneManagement />;
          case 'team':
            return <TeamPage />;
          case 'roles':
            return <RoleManagement />;
          case 'commercial-activity':
            return <CommercialActivityPage />;
          case 'data':
            return <DataManagement />;
          case 'notifications':
            return <NotificationsPage />;
          case 'settings':
            return <SystemSettings />;
          case 'tickets':
            return <TicketManagement />;
          case 'subscription-management':
          case 'subscriptions':
            return <SubscriptionManagementPage />;
          default:
            return <SuperAdminDashboard />;
        }
      
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  const content = (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Mode Banner */}
      <OfflineBanner />
      
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
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main id="main-content" className={`flex-1 pt-16 lg:pl-64 pb-24 lg:pb-0 overflow-x-hidden ${sessionError ? 'sm:pt-14' : ''}`}>
          {renderMainContent()}
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile Only - Client and Supplier Roles */}
      {(user?.role === 'client' || user?.role === 'supplier') && (
        <BottomNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}

      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator />

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Rating Reminder - Disabled for RAVITO Gestion (no marketplace orders) */}
      
      {/* PWA Install and Update Prompts */}
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  );

  return <SubscriptionProvider>{content}</SubscriptionProvider>;
};

function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <NotificationProvider>
          <ToastProvider>
            <PermissionProvider>
              <CommissionProvider>
                <PricingProvider>
                  <RatingProvider>
                    <AppContent />
                  </RatingProvider>
                </PricingProvider>
              </CommissionProvider>
            </PermissionProvider>
          </ToastProvider>
        </NotificationProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;