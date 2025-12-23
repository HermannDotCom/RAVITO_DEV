import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryFilters } from '../DeliveryFilters';

describe('DeliveryFilters', () => {
  const mockOnFilterChange = vi.fn();

  const counts = {
    all: 10,
    pending: 3,
    inProgress: 2,
    completed: 5,
  };

  it('should render all filter options with counts', () => {
    render(
      <DeliveryFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={counts}
      />
    );

    expect(screen.getByText('Toutes (10)')).toBeInTheDocument();
    expect(screen.getByText('À faire (3)')).toBeInTheDocument();
    expect(screen.getByText('En cours (2)')).toBeInTheDocument();
    expect(screen.getByText('Terminées (5)')).toBeInTheDocument();
  });

  it('should highlight active filter', () => {
    render(
      <DeliveryFilters
        activeFilter="pending"
        onFilterChange={mockOnFilterChange}
        counts={counts}
      />
    );

    const pendingButton = screen.getByText('À faire (3)');
    expect(pendingButton).toBeInTheDocument();
    
    // Active filter should have gradient background
    expect(pendingButton.className).toContain('from-orange-500');
  });

  it('should call onFilterChange when clicking a filter', () => {
    render(
      <DeliveryFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={counts}
      />
    );

    const inProgressButton = screen.getByText('En cours (2)');
    inProgressButton.click();

    expect(mockOnFilterChange).toHaveBeenCalledWith('in_progress');
  });

  it('should render with zero counts', () => {
    const zeroCounts = {
      all: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    render(
      <DeliveryFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        counts={zeroCounts}
      />
    );

    expect(screen.getByText('Toutes (0)')).toBeInTheDocument();
    expect(screen.getByText('À faire (0)')).toBeInTheDocument();
  });
});
