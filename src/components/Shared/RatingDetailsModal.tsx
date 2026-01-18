import React, { useEffect } from 'react';
import { X, Star, TrendingUp, Award } from 'lucide-react';
import { RatingDetailsModalProps } from '../../types/rating';
import { useRatingDetails } from '../../hooks/useRatingDetails';
import { RatingDistribution } from './RatingDistribution';
import { ReviewCard } from './ReviewCard';

export const RatingDetailsModal: React.FC<RatingDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userType,
  userName
}) => {
  const {
    averageRating,
    totalReviews,
    distribution,
    reviews,
    hasMore,
    loadMore,
    isLoading,
    error
  } = useRatingDetails(userId, userType);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = userName || (userType === 'client' ? 'Client' : 'Fournisseur');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black bg-opacity-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full h-[90vh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 fill-yellow-400" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Évaluations de {displayName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading && reviews.length === 0 ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ) : totalReviews === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Award className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Aucune évaluation
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                Cet utilisateur n'a pas encore reçu d'évaluations.
              </p>
            </div>
          ) : (
            <>
              {/* Average Rating Summary */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                  {averageRating.toFixed(1)} / 5
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  ({totalReviews} avis)
                </p>
              </div>

              {/* Rating Distribution */}
              <div>
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Répartition des notes
                  </h3>
                </div>
                <RatingDistribution distribution={distribution} total={totalReviews} />
              </div>

              {/* Reviews List */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
                  <span>💬</span>
                  <span>Derniers avis</span>
                </h3>
                
                <div className="space-y-2 sm:space-y-3">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Chargement...' : 'Voir plus d\'avis...'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
