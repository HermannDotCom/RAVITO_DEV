import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
