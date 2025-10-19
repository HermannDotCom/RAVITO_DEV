import React, { useState } from 'react';
import { Star, Clock, Package, MessageCircle } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { createRating } from '../../services/ratingService';

interface RatingFormProps {
  onSubmit: (rating: any) => void;
  supplierName: string;
}

export const RatingForm: React.FC<RatingFormProps> = ({ onSubmit, supplierName }) => {
  const { user } = useAuth();
  const { clientCurrentOrder } = useOrder();
  const [ratings, setRatings] = useState({
    punctuality: 0,
    quality: 0,
    communication: 0
  });
  const [comment, setComment] = useState('');
  const [hoveredCriteria, setHoveredCriteria] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = [
    { key: 'punctuality', label: 'Ponctualité', icon: Clock, description: 'Respect des délais annoncés' },
    { key: 'quality', label: 'Qualité', icon: Package, description: 'État des produits et emballages' },
    { key: 'communication', label: 'Communication', icon: MessageCircle, description: 'Réactivité et clarté' }
  ];

  const handleStarClick = (criteriaKey: string, star: number) => {
    setRatings(prev => ({ ...prev, [criteriaKey]: star }));
  };

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every(rating => rating > 0);
    if (!allRated || !user || !clientCurrentOrder) return;

    setIsSubmitting(true);

    try {
      const success = await createRating({
        orderId: clientCurrentOrder.id,
        fromUserId: user.id,
        toUserId: clientCurrentOrder.supplierId!,
        fromUserRole: 'client',
        toUserRole: 'supplier',
        punctuality: ratings.punctuality,
        quality: ratings.quality,
        communication: ratings.communication,
        comment: comment || undefined
      });

      if (success) {
        onSubmit({ ratings, comment });
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

  const isComplete = Object.values(ratings).every(rating => rating > 0);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Évaluez votre livraison</h2>
          <p className="text-gray-600">Comment s'est passée votre commande avec <strong>{supplierName}</strong> ?</p>
        </div>

        <div className="space-y-6">
          {criteria.map((criterion) => {
            const CriterionIcon = criterion.icon;
            return (
              <div key={criterion.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CriterionIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{criterion.label}</h4>
                      <p className="text-sm text-gray-600">{criterion.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
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
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredCriteria === criterion.key ? hoveredStar : ratings[criterion.key as keyof typeof ratings])
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              placeholder="Partagez votre expérience..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Valider l\'évaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};