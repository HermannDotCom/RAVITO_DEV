import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingDistribution } from '../RatingDistribution';
import { RatingDistribution as RatingDistributionType } from '../../../types/rating';

describe('RatingDistribution', () => {
  const mockDistribution: RatingDistributionType = {
    5: 10,
    4: 3,
    3: 2,
    2: 1,
    1: 1
  };

  const total = 17;

  it('renders all 5 rating levels', () => {
    const { container } = render(
      <RatingDistribution distribution={mockDistribution} total={total} />
    );
    
    // Should have 5 rows for each star rating
    const rows = container.querySelectorAll('.flex.items-center.space-x-3');
    expect(rows).toHaveLength(5);
  });

  it('displays correct percentages', () => {
    render(<RatingDistribution distribution={mockDistribution} total={total} />);
    
    // 10 out of 17 = 59%
    expect(screen.getByText('59%')).toBeInTheDocument();
    // 3 out of 17 = 18%
    expect(screen.getByText('18%')).toBeInTheDocument();
    // 2 out of 17 = 12%
    expect(screen.getByText('12%')).toBeInTheDocument();
    // 1 out of 17 = 6%
    expect(screen.getAllByText('6%')).toHaveLength(2); // Two ratings with 1 review each
  });

  it('displays correct counts', () => {
    render(<RatingDistribution distribution={mockDistribution} total={total} />);
    
    expect(screen.getByText('(10)')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getAllByText('(1)')).toHaveLength(2);
  });

  it('handles zero total correctly', () => {
    const emptyDistribution: RatingDistributionType = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    render(<RatingDistribution distribution={emptyDistribution} total={0} />);
    
    // All percentages should be 0%
    const percentages = screen.getAllByText('0%');
    expect(percentages).toHaveLength(5);
  });

  it('renders progress bars with correct widths', () => {
    const { container } = render(
      <RatingDistribution distribution={mockDistribution} total={total} />
    );
    
    const progressBars = container.querySelectorAll('.bg-gradient-to-r');
    expect(progressBars).toHaveLength(5);
    
    // Check that the first bar (5 stars) has the highest width (59%)
    const firstBar = progressBars[0] as HTMLElement;
    expect(firstBar.style.width).toBe('59%');
  });
});
