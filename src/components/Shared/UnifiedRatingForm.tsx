import React, { useState, useEffect } from 'react';
import { Star, Clock, Package, MessageCircle, CheckCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createRating } from '../../services/ratingService';
import { supabase } from '../../lib/supabase';

interface UnifiedRatingFormProps {
  orderId: string;
  toUserId: string;
  toUserRole: 'client' | 'supplier';
  otherPartyName: string;
  onSubmit: () => void;
  onCancel: () => void;
}

interface Criterion {
  key: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const clientCriteria: Criterion[] = [
  { key: 'punctuality', label: 'Ponctualité', icon: Clock, description: 'Respect des délais de livraison' },
  { key: 'quality', label: 'Qualité des produits', icon: Package, description: 'État et fraîcheur des produits' },
  { key: 'communication', label: 'Communication', icon: MessageCircle, description: 'Réactivité et professionnalisme' }
];

const supplierCriteria: Criterion[] = [
  { key: 'punctuality', label: 'Ponctualité', icon: Clock, description: 'Le client était-il prêt à l\'heure ?' },
  { key: 'quality', label: 'Préparation', icon: Package, description: 'Casiers vides prêts, paiement organisé' },
  { key: 'communication', label: 'Communication', icon: MessageCircle, description: 'Réactivité et courtoisie' }
];

const getEmoji = (average: number): string => {
  if (average === 0) return '😊';
  if (average < 2) return '😢';
  if (average < 3) return '😐';
  if (average < 4) return '🙂';
  if (average < 4.5) return '😊';
  return '🤩';
};

const getEmojiMessage = (average: number): string => {
  if (average === 0) return 'Notez votre expérience';
  if (average < 2) return 'Désolé pour cette expérience...';
  if (average < 3) return 'Peut mieux faire';
  if (average < 4) return 'Bonne expérience !';
  if (average < 4.5) return 'Très satisfait !';
  return 'Excellent ! 🎉';
};

export const UnifiedRatingForm: React.FC<UnifiedRatingFormProps> = ({
  orderId,
  toUserId,
  toUserRole,
  otherPartyName,
  onSubmit,
  onCancel
}) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({
    punctuality: 0,
    quality: 0,
    communication: 0
  });
  const [comment, setComment] = useState('');
  const [hoveredCriteria, setHoveredCriteria] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  const fromUserRole = user?.role === 'client' ? 'client' : 'supplier';
  const criteria = fromUserRole === 'client' ? clientCriteria : supplierCriteria;

  const average = Object.values(ratings).reduce((sum, r) => sum + r, 0) / 3;
  const isComplete = Object.values(ratings).every(r => r > 0);

  const handleStarClick = (criteriaKey: string, star: number) => {
    setRatings(prev => ({ ...prev, [criteriaKey]: star }));
  };

  const triggerConfetti = () => {
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 3000);
  };

  const handleSubmit = async () => {
    if (!isComplete || !user) return;

    setIsSubmitting(true);

    try {
      // Check for existing rating
      const { data: existingRatings } = await supabase
        .from('ratings')
        .select('id')
        .eq('order_id', orderId)
        .eq('from_user_id', user.id);

      if (existingRatings && existingRatings.length > 0) {
        alert('Vous avez déjà évalué cette commande.');
        setIsSubmitting(false);
        return;
      }

      const success = await createRating({
        orderId,
        fromUserId: user.id,
        toUserId,
        fromUserRole: fromUserRole as 'client' | 'supplier',
        toUserRole,
        punctuality: ratings.punctuality,
        quality: ratings.quality,
        communication: ratings.communication,
        comment: comment || undefined
      });

      if (success) {
        setShowSuccess(true);
        triggerConfetti();
        setTimeout(() => {
          onSubmit();
        }, 2500);
      } else {
        alert('Erreur lors de l\'envoi de l\'évaluation');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur lors de l\'envoi de l\'évaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="relative overflow-hidden">
        {/* Confetti */}
        {confetti.map(c => (
          <div
            key={c.id}
            className="absolute w-2 h-2 animate-confetti"
            style={{
              left: `${c.left}%`,
              top: '-10px',
              animationDelay: `${c.delay}s`,
              backgroundColor: ['#f97316', '#22c55e', '#eab308', '#3b82f6'][c.id % 4]
            }}
          />
        ))}
        
        <div className="text-center py-12 px-6">
          <div className="relative inline-block mb-6">
            <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce-slow shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Merci pour votre évaluation ! 🙏
          </h3>
          <p className="text-gray-600 mb-4">
            Cela aide à améliorer le service pour tous.
          </p>
          
          <div className="flex justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-8 w-8 transition-all duration-300 ${
                  star <= Math.round(average)
                    ? 'text-yellow-400 fill-yellow-400 animate-star-pop'
                    : 'text-gray-300'
                }`}
                style={{ animationDelay: `${star * 0.1}s` }}
              />
            ))}
          </div>
          
          <p className="text-lg font-semibold text-green-600">
            Note moyenne : {average.toFixed(1)}/5
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Emoji Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2 transition-all duration-300 transform hover:scale-110">
          {getEmoji(average)}
        </div>
        <p className="text-gray-600 font-medium transition-all duration-300">
          {getEmojiMessage(average)}
        </p>
        {average > 0 && (
          <p className="text-sm text-orange-600 font-semibold mt-1">
            Note moyenne : {average.toFixed(1)}/5
          </p>
        )}
      </div>

      {/* Rating Criteria */}
      {criteria.map((criterion) => {
        const CriterionIcon = criterion.icon;
        const currentRating = ratings[criterion.key];
        
        return (
          <div 
            key={criterion.key} 
            className="bg-white border border-gray-200 rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:border-orange-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <CriterionIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{criterion.label}</h4>
                  <p className="text-sm text-gray-500">{criterion.description}</p>
                </div>
              </div>
              {currentRating > 0 && (
                <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  {currentRating}/5
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoveredCriteria === criterion.key ? hoveredStar : currentRating);
                
                return (
                  <button
                    key={star}
                    onClick={() => handleStarClick(criterion.key, star)}
                    onMouseEnter={() => {
                      setHoveredCriteria(criterion.key);
                      setHoveredStar(star);
                    }}
                    onMouseLeave={() => {
                      setHoveredCriteria(null);
                      setHoveredStar(0);
                    }}
                    className={`
                      transition-all duration-200 transform
                      ${isActive ? 'scale-110' : 'scale-100 hover:scale-125'}
                    `}
                    type="button"
                    aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`
                        h-10 w-10 transition-all duration-200
                        ${isActive 
                          ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' 
                          : 'text-gray-300 hover:text-yellow-300'
                        }
                      `}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Comment Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          💬 Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-200"
          placeholder={`Partagez votre expérience avec ${otherPartyName}...`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
          type="button"
        >
          <X className="h-5 w-5" />
          <span>Annuler</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className={`
            flex-1 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2
            ${isComplete && !isSubmitting
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          type="button"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Valider l'évaluation</span>
            </>
          )}
        </button>
      </div>

      {/* Helper Text */}
      {!isComplete && (
        <p className="text-center text-sm text-gray-500">
          ⭐ Veuillez noter tous les critères pour valider
        </p>
      )}
    </div>
  );
};
