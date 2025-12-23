import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from '../ReviewCard';
import { Review } from '../../../types/rating';

describe('ReviewCard', () => {
  const mockReview: Review = {
    id: 'review-1',
    rating: 5,
    comment: 'Excellent service!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    reviewerType: 'client'
  };

  it('renders review rating with correct number of stars', () => {
    const { container } = render(<ReviewCard review={mockReview} />);
    const stars = container.querySelectorAll('.fill-yellow-400');
    expect(stars).toHaveLength(5);
  });

  it('displays review comment when present', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText(/"Excellent service!"/)).toBeInTheDocument();
  });

  it('displays reviewer type as masked', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText('— Client masqué')).toBeInTheDocument();
  });

  it('displays supplier reviewer type correctly', () => {
    const supplierReview: Review = {
      ...mockReview,
      reviewerType: 'supplier'
    };
    render(<ReviewCard review={supplierReview} />);
    expect(screen.getByText('— Fournisseur masqué')).toBeInTheDocument();
  });

  it('does not crash when comment is null', () => {
    const reviewWithoutComment: Review = {
      ...mockReview,
      comment: null
    };
    render(<ReviewCard review={reviewWithoutComment} />);
    expect(screen.getByText('— Client masqué')).toBeInTheDocument();
  });

  it('formats relative date correctly for recent reviews', () => {
    const recentReview: Review = {
      ...mockReview,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    };
    render(<ReviewCard review={recentReview} />);
    expect(screen.getByText(/Il y a 30 minute/)).toBeInTheDocument();
  });
});
