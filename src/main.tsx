import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupObsoleteLocalStorage } from './utils/localStorageCleanup';

// Perform targeted cleanup of obsolete localStorage keys on app startup
// This only removes known obsolete keys, preserving all legitimate user data
cleanupObsoleteLocalStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
