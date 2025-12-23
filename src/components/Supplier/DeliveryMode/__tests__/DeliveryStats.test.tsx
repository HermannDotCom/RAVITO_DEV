import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryStats } from '../DeliveryStats';
import { DeliveryStats as DeliveryStatsType } from '../../../../types/delivery';

describe('DeliveryStats', () => {
  const mockStats: DeliveryStatsType = {
    pending: 3,
    inProgress: 1,
    completed: 5,
    totalEarnings: 125000,
  };

  const mockOnFilterSelect = vi.fn();

  it('should render all statistics correctly', () => {
    render(
      <DeliveryStats 
        stats={mockStats} 
        onFilterSelect={mockOnFilterSelect} 
      />
    );

    // Check if numbers are displayed
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check if labels are displayed
    expect(screen.getByText('À faire')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Terminées')).toBeInTheDocument();
  });

  it('should call onFilterSelect when clicking on a stat button', () => {
    render(
      <DeliveryStats 
        stats={mockStats} 
        onFilterSelect={mockOnFilterSelect} 
      />
    );

    const pendingButton = screen.getByText('À faire').closest('button');
    pendingButton?.click();

    expect(mockOnFilterSelect).toHaveBeenCalledWith('pending');
  });

  it('should render with zero values', () => {
    const emptyStats: DeliveryStatsType = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      totalEarnings: 0,
    };

    render(
      <DeliveryStats 
        stats={emptyStats} 
        onFilterSelect={mockOnFilterSelect} 
      />
    );

    // Should render zeros
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
});
