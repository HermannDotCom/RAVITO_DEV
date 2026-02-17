import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupObsoleteLocalStorage } from './utils/localStorageCleanup';
import { runAuthDiagnostics } from './utils/authDiagnostics';
import { registerServiceWorker } from './registerSW';
import { initSentry } from './lib/sentry';
import { SentryErrorBoundary } from './components/ErrorBoundary/SentryErrorBoundary';
import { syncManager } from './lib/syncManager';

// Initialiser Sentry en premier
initSentry();

// Perform targeted cleanup of obsolete localStorage keys on app startup
cleanupObsoleteLocalStorage();

// Expose diagnostics for debugging login issues
if (typeof window !== 'undefined') {
  (window as any).runAuthDiagnostics = runAuthDiagnostics;
  console.log('💡 Auth diagnostics available: Run window.runAuthDiagnostics() in console');
}

// Register Service Worker
registerServiceWorker();

// Handle background sync trigger from Service Worker message
window.addEventListener('ravito:triggerSync', () => {
  syncManager.syncOfflineActions().catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
);
