import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorkerRegistration>;
      setRegistration(customEvent.detail);
      setShowPrompt(true);
    };

    window.addEventListener('swUpdate', handleUpdate);

    return () => {
      window.removeEventListener('swUpdate', handleUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;

    setIsUpdating(true);

    // Send message to service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Listen for controlling service worker change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page to get the new content
      window.location.reload();
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-4 lg:max-w-md z-40 animate-slideUp">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-2xl border border-green-400 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1">
                Mise à jour disponible
              </h3>
              <p className="text-sm text-green-50 mb-3">
                Une nouvelle version de RAVITO est prête à être installée
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-green-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-green-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Mettre à jour</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="px-4 py-2.5 text-white hover:text-green-50 hover:bg-white hover:bg-opacity-10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
