import React, { useState } from 'react';
import { Star, Clock, Package, MessageCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface SupplierRatingFormProps {
  orderId: string;
  toUserId: string; // Client ID
  onSubmit: (result: { ratings: { punctuality: number; quality: number; communication: number }; comment?: string }) => void;
  onCancel: () => void;
}

export const SupplierRatingForm: React.FC<SupplierRatingFormProps> = ({
  orderId,
  toUserId,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState({ punctuality: 0, quality: 0, communication: 0 });
  const [comment, setComment] = useState('');
  const [hoveredCriteria, setHoveredCriteria] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = [
    { key: 'punctuality', label: 'Ponctualité', icon: Clock, description: 'Le client était-il prêt à l\'heure ?' },
    { key: 'quality', label: 'Préparation', icon: Package, description: 'Casiers vides prêts, paiement organisé' },
    { key: 'communication', label: 'Communication', icon: MessageCircle, description: 'Réactivité et courtoisie du client' },
  ];

  const handleStarClick = (criteriaKey: string, star: number) => {
    setRatings(prev => ({ ...prev, [criteriaKey]: star }));
  };

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every(rating => rating > 0);
    if (!allRated || !user || !orderId || !toUserId) {
      alert('Veuillez noter tous les critères avant de valider.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Vérification d'un rating déjà existant
      const { data: existingRatings, error: checkError } = await supabase
        .from('ratings')
        .select('id')
        .eq('order_id', orderId)
        .eq('from_user_id', user.id);

      // Si erreur réseau, on continue quand même (la contrainte DB bloquera si doublon)
      if (!checkError && existingRatings && existingRatings.length > 0) {
        alert("Vous avez déjà évalué cette commande.");
        setIsSubmitting(false);
        return;
      }

      // Insertion de l'évaluation
      const { error: insertError } = await supabase
        .from('ratings')
        .insert([
          {
            order_id: orderId,
            from_user_id: user.id,
            to_user_id: toUserId,
            from_user_role: 'supplier',
            to_user_role: 'client',
            punctuality: ratings.punctuality,
            quality: ratings.quality,
            communication: ratings.communication,
            overall:
              Math.round(
                ((ratings.punctuality + ratings.quality + ratings.communication) / 3) * 10
              ) / 10,
            comment: comment || undefined,
          },
        ]);

      if (!insertError) {
        onSubmit({ ratings, comment });
      } else {
        console.error('Insert error:', insertError);
        if (insertError.code === '23505') {
          alert('Vous avez déjà évalué cette commande.');
        } else {
          alert('Erreur lors de l\'envoi de l\'évaluation: ' + insertError.message);
        }
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Erreur lors de l\'envoi de l\'évaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = Object.values(ratings).every(rating => rating > 0);

  return (
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
                  type="button"
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

      {/* Commentaire optionnel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Partagez votre expérience avec ce client..."
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          type="button"
        >
          <X className="h-4 w-4" />
          <span>Annuler</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          type="button"
        >
          <CheckCircle className="h-4 w-4" />
          <span>{isSubmitting ? 'Envoi en cours...' : 'Valider l\'évaluation'}</span>
        </button>
      </div>
    </div>
  );
};
