import React from 'react';
import { Star } from 'lucide-react';
import { ReviewCardProps } from '../../types/rating';

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}`;
    if (diffWeeks < 4) return `Il y a ${diffWeeks} semaine${diffWeeks !== 1 ? 's' : ''}`;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header with stars and date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(review.rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{formatRelativeDate(review.createdAt)}</span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 text-sm mb-3 italic">"{review.comment}"</p>
      )}

      {/* Anonymous author */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-gray-500">
          — {review.reviewerType === 'client' ? 'Client masqué' : 'Fournisseur masqué'}
        </span>
      </div>
    </div>
  );
};
