import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMonitoring } from './services/monitoring';

// Initialize monitoring services
initializeMonitoring({
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
  },
  performanceTracking: true,
  businessMetrics: true,
});

const allowedKeys = ['theme', 'sb-byuwnxrfnfkxtmegyazj-auth-token'];
Object.keys(localStorage).forEach(key => {
  if (!allowedKeys.includes(key)) {
    localStorage.removeItem(key);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
