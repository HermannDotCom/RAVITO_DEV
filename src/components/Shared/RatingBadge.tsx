import React, { useState } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { RatingBadgeProps } from '../../types/rating';
import { RatingDetailsModal } from './RatingDetailsModal';

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  reviewCount,
  userId,
  userType,
  userName,
  size = 'md',
  clickable = true
}) => {
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    sm: {
      container: 'text-xs',
      star: 'h-3 w-3',
      chevron: 'h-3 w-3'
    },
    md: {
      container: 'text-sm',
      star: 'h-4 w-4',
      chevron: 'h-4 w-4'
    },
    lg: {
      container: 'text-base',
      star: 'h-5 w-5',
      chevron: 'h-5 w-5'
    }
  };

  const classes = sizeClasses[size];

  const content = (
    <span className={`flex items-center space-x-1 ${classes.container}`}>
      <Star className={`${classes.star} text-yellow-400 fill-yellow-400`} />
      <span className="font-semibold">
        {rating > 0 ? rating.toFixed(1) : 'N/A'}
      </span>
      {clickable && reviewCount > 0 && (
        <ChevronRight className={`${classes.chevron} text-gray-400`} />
      )}
    </span>
  );

  if (!clickable || reviewCount === 0) {
    return <div className={classes.container}>{content}</div>;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        aria-label={`Voir les ${reviewCount} évaluations`}
      >
        {content}
      </button>

      {showModal && (
        <RatingDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId={userId}
          userType={userType}
          userName={userName}
        />
      )}
    </>
  );
};
