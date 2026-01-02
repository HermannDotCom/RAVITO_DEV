import React from 'react';
import { AlertTriangle, MessageSquare, LogOut } from 'lucide-react';

interface DeactivatedAccountModalProps {
  userName: string;
  onContactSupport: () => void;
  onLogout: () => void;
}

export const DeactivatedAccountModal: React.FC<DeactivatedAccountModalProps> = ({
  userName,
  onContactSupport,
  onLogout
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-4">
              <AlertTriangle className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Compte Désactivé
          </h2>
          <p className="text-orange-50">
            Votre compte a été temporairement désactivé
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 leading-relaxed">
              Bonjour <span className="font-semibold">{userName}</span>,
            </p>
            <p className="text-gray-700 mt-3 leading-relaxed">
              Votre compte a été désactivé par un administrateur. Pour plus d'informations
              ou pour demander la réactivation de votre compte, veuillez contacter notre
              service support.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Contacter le Support</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Se Déconnecter</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Si vous pensez qu'il s'agit d'une erreur, contactez immédiatement notre équipe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
