import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show prompt after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  // Don't show if already installed, dismissed, or in standalone mode
  if (isInstalled || isStandalone || isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  // Don't show until animation delay has passed
  if (!isVisible) {
    return null;
  }

  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-slideUp">
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Installer RAVITO
            </h2>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                1
              </div>
              <div className="flex-1">
                <p className="text-gray-700">
                  Appuyez sur le bouton <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-blue-600 font-medium"><Share className="w-4 h-4" />Partager</span> en bas de l'écran Safari
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                2
              </div>
              <div className="flex-1">
                <p className="text-gray-700">
                  Faites défiler et sélectionnez <span className="font-semibold">"Sur l'écran d'accueil"</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                3
              </div>
              <div className="flex-1">
                <p className="text-gray-700">
                  Appuyez sur <span className="font-semibold">"Ajouter"</span> pour installer l'application
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowIOSInstructions(false)}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
          >
            Compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-md z-40 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">R</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Installer RAVITO
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Installez l'application pour un accès rapide et une meilleure expérience
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Installer</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600 animate-shrink" />
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shrink {
          transform-origin: left;
          animation: shrink 30s linear forwards;
        }
      `}</style>
    </div>
  );
};
