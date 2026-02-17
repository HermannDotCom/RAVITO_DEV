export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Notify app when new version is available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }));
          }
        });
      }
    });

    // Listen for messages from Service Worker (e.g. TRIGGER_SYNC from background sync)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_SYNC') {
        window.dispatchEvent(new CustomEvent('ravito:triggerSync'));
      }
    });

    // Register background sync tag when supported
    if ('SyncManager' in window) {
      window.addEventListener('online', async () => {
        try {
          await registration.sync.register('ravito-sync-queue');
        } catch {
          // Background sync not available — syncManager handles it via browser events
        }
      });
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}
