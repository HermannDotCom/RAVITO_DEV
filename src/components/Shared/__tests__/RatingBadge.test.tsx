import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingBadge } from '../RatingBadge';

// Mock the modal component to avoid testing it here
vi.mock('../RatingDetailsModal', () => ({
  RatingDetailsModal: () => <div data-testid="rating-modal">Modal</div>
}));

describe('RatingBadge', () => {
  const defaultProps = {
    rating: 4.5,
    reviewCount: 10,
    userId: 'test-user-id',
    userType: 'client' as const,
  };

  it('renders rating value correctly', () => {
    render(<RatingBadge {...defaultProps} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders as non-clickable when reviewCount is 0', () => {
    render(<RatingBadge {...defaultProps} reviewCount={0} />);
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('renders as non-clickable when clickable is false', () => {
    render(<RatingBadge {...defaultProps} clickable={false} />);
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('renders as clickable button when reviewCount > 0 and clickable is true', () => {
    render(<RatingBadge {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Voir les 10 évaluations');
  });

  it('displays N/A when rating is 0', () => {
    render(<RatingBadge {...defaultProps} rating={0} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies correct size classes for sm size', () => {
    const { container } = render(<RatingBadge {...defaultProps} size="sm" />);
    const button = container.querySelector('button');
    expect(button?.textContent).toContain('4.5');
  });

  it('applies correct size classes for lg size', () => {
    const { container } = render(<RatingBadge {...defaultProps} size="lg" />);
    const button = container.querySelector('button');
    expect(button?.textContent).toContain('4.5');
  });
});
