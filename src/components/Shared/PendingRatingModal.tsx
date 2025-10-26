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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-3">
          {title}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>

        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-6 w-6 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={onGoToRating}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Star className="h-5 w-5 mr-2" />
            {action}
          </button>
        </div>
      </div>
    </div>
  );
};
