export interface RatingDetails {
  userId: string;
  userType: 'client' | 'supplier';
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerType: 'client' | 'supplier';
  // No identifiable information to preserve anonymity
}

export interface RatingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'client' | 'supplier';
  userName?: string; // May be masked
}

export interface RatingBadgeProps {
  rating: number;
  reviewCount: number;
  userId: string;
  userType: 'client' | 'supplier';
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean; // default: true
}

export interface RatingDistributionProps {
  distribution: RatingDistribution;
  total: number;
}

export interface ReviewCardProps {
  review: Review;
}
