import React, { useState, useEffect } from 'react';
import { Star, User, MessageCircle, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { getOrderMutualRatings, Rating } from '../../services/ratingService';

interface MutualRatingsDisplayProps {
  orderId: string;
  currentUserRole: 'client' | 'supplier';
}

interface RatingCardProps {
  rating: Rating;
  title: string;
  subtitle: string;
  color: 'orange' | 'green';
}

const RatingCard: React.FC<RatingCardProps> = ({ rating, title, subtitle, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const colorClasses = {
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      icon: 'bg-orange-500',
      text: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'bg-green-500',
      text: 'text-green-600',
      badge: 'bg-green-100 text-green-700'
    }
  };

  const colors = colorClasses[color];

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const criteria = [
    { key: 'punctuality', label: 'Ponctualité', icon: Clock, value: rating.punctuality },
    { key: 'quality', label: rating.from_user_role === 'client' ? 'Qualité' : 'Préparation', icon: Package, value: rating.quality },
    { key: 'communication', label: 'Communication', icon: MessageCircle, value: rating.communication }
  ];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-5 transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`h-12 w-12 ${colors.icon} rounded-full flex items-center justify-center shadow-md`}>
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(Number(rating.overall))
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className={`text-sm font-semibold ${colors.text} mt-1`}>
            {Number(rating.overall).toFixed(1)}/5
          </p>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
      >
        <span>{isExpanded ? 'Masquer les détails' : 'Voir les détails'}</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Criteria Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {criteria.map(({ key, label, icon: Icon, value }) => (
              <div key={key} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${colors.text}`} />
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <div className="flex items-center justify-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-1">{value}/5</p>
              </div>
            ))}
          </div>

          {/* Comment */}
          {rating.comment && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MessageCircle className={`h-4 w-4 ${colors.text}`} />
                <span className="text-sm font-semibold text-gray-700">Commentaire</span>
              </div>
              <p className="text-gray-600 text-sm italic">"{rating.comment}"</p>
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400 text-center">
            Évalué le {formatDate(rating.created_at)}
          </p>
        </div>
      )}
    </div>
  );
};

export const MutualRatingsDisplay: React.FC<MutualRatingsDisplayProps> = ({
  orderId,
  currentUserRole
}) => {
  const [clientRating, setClientRating] = useState<Rating | null>(null);
  const [supplierRating, setSupplierRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [bothCompleted, setBothCompleted] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      const result = await getOrderMutualRatings(orderId);
      setClientRating(result.clientRating);
      setSupplierRating(result.supplierRating);
      setBothCompleted(result.bothCompleted);
      setLoading(false);
    };

    fetchRatings();
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Only show if both ratings exist
  if (!bothCompleted || !clientRating || !supplierRating) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-100 to-green-100 px-4 py-2 rounded-full mb-3">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-gray-700">Évaluations mutuelles</span>
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        </div>
        <p className="text-sm text-gray-500">
          Les deux parties ont évalué cette transaction
        </p>
      </div>

      {/* Ratings Cards */}
      <div className="space-y-4">
        {/* Show the other party's rating first (what they said about you) */}
        {currentUserRole === 'client' ? (
          <>
            <RatingCard
              rating={supplierRating}
              title="Avis du fournisseur"
              subtitle={supplierRating.from_user?.business_name || supplierRating.from_user?.name || 'Fournisseur'}
              color="green"
            />
            <RatingCard
              rating={clientRating}
              title="Votre avis"
              subtitle="Sur le fournisseur"
              color="orange"
            />
          </>
        ) : (
          <>
            <RatingCard
              rating={clientRating}
              title="Avis du client"
              subtitle={clientRating.from_user?.business_name || clientRating.from_user?.name || 'Client'}
              color="orange"
            />
            <RatingCard
              rating={supplierRating}
              title="Votre avis"
              subtitle="Sur le client"
              color="green"
            />
          </>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">Moyenne globale:</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(star => {
                const avgOverall = (Number(clientRating.overall) + Number(supplierRating.overall)) / 2;
                return (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avgOverall)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                );
              })}
            </div>
            <span className="font-semibold text-gray-900">
              {((Number(clientRating.overall) + Number(supplierRating.overall)) / 2).toFixed(1)}/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
