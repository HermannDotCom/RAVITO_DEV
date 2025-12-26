import { useState, useEffect } from 'react';
import { RatingDetails, RatingDistribution, Review } from '../types/rating';
import { getRatingDetails, getReviews } from '../services/ratingService';

interface UseRatingDetailsReturn {
  // Data
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
  reviews: Review[];
  
  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useRatingDetails = (
  userId: string | null,
  userType: 'client' | 'supplier'
): UseRatingDetailsReturn => {
  const [ratingDetails, setRatingDetails] = useState<RatingDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch rating details and first page of reviews in parallel
        const [details, reviewsData] = await Promise.all([
          getRatingDetails(userId, userType),
          getReviews(userId, userType, 1, 10)
        ]);

        if (details) {
          setRatingDetails(details);
        }

        setReviews(reviewsData.reviews);
        setHasMore(reviewsData.hasMore);
        setPage(1);
      } catch (err) {
        console.error('Error loading rating details:', err);
        setError('Erreur lors du chargement des évaluations');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId, userType]);

  // Load more reviews
  const loadMore = async () => {
    if (!userId || !hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const reviewsData = await getReviews(userId, userType, nextPage, 10);
      
      setReviews(prev => [...prev, ...reviewsData.reviews]);
      setHasMore(reviewsData.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more reviews:', err);
      setError('Erreur lors du chargement des avis supplémentaires');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    averageRating: ratingDetails?.averageRating || 0,
    totalReviews: ratingDetails?.totalReviews || 0,
    distribution: ratingDetails?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews,
    hasMore,
    loadMore,
    isLoading,
    error
  };
};
