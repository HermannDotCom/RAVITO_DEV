import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupObsoleteLocalStorage } from './utils/localStorageCleanup';
import { runAuthDiagnostics } from './utils/authDiagnostics';
import { registerServiceWorker } from './registerSW';

// Perform targeted cleanup of obsolete localStorage keys on app startup
// This only removes known obsolete keys, preserving all legitimate user data
cleanupObsoleteLocalStorage();

// Expose diagnostics for debugging login issues
if (typeof window !== 'undefined') {
  (window as any).runAuthDiagnostics = runAuthDiagnostics;
  console.log('💡 Auth diagnostics available: Run window.runAuthDiagnostics() in console');
}

// Register Service Worker
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
