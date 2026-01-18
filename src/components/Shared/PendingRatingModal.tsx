import React from 'react';
import { AlertCircle, Star } from 'lucide-react';

interface PendingRatingModalProps {
  userRole: 'client' | 'supplier';
  onClose: () => void;
  onGoToRating: () => void;
}

export const PendingRatingModal: React.FC<PendingRatingModalProps> = ({
  userRole,
  onClose,
  onGoToRating
}) => {
  const getMessage = () => {
    if (userRole === 'client') {
      return {
        title: 'Évaluation requise',
        message: 'Vous devez d\'abord évaluer votre dernière transaction avant de passer une nouvelle commande.',
        action: 'Aller évaluer'
      };
    } else {
      return {
        title: 'Évaluation requise',
        message: 'Vous devez d\'abord évaluer votre dernière transaction avant d\'accepter une nouvelle commande.',
        action: 'Aller évaluer'
      };
    }
  };

  const { title, message, action } = getMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg w-full h-auto sm:max-w-lg sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center mb-3">
          {title}
        </h2>

        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>

        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onGoToRating}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {action}
          </button>
        </div>
      </div>
    </div>
  );
};
