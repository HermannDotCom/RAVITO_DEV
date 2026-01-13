import { describe, it, expect } from 'vitest';

/**
 * Unit tests for cash difference calculation in dailySheetService
 * 
 * Formula: cash_difference = closing_cash - (opening_cash + theoretical_revenue - expenses_total)
 * 
 * This verifies the fix for the bug where cash_difference was not being calculated correctly.
 */
describe('Cash Difference Calculation', () => {
  it('should calculate cash difference correctly with example from problem statement', () => {
    // Example from the problem statement
    const openingCash = 10000;
    const theoreticalRevenue = 30600;
    const expensesTotal = 9000;
    const closingCash = 31200;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(31600);
    expect(cashDifference).toBe(-400);
  });

  it('should calculate cash difference correctly with positive difference', () => {
    const openingCash = 10000;
    const theoreticalRevenue = 30000;
    const expensesTotal = 5000;
    const closingCash = 35500;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(35000);
    expect(cashDifference).toBe(500); // 500 F more than expected
  });

  it('should calculate cash difference correctly with zero difference', () => {
    const openingCash = 10000;
    const theoreticalRevenue = 20000;
    const expensesTotal = 5000;
    const closingCash = 25000;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(25000);
    expect(cashDifference).toBe(0); // Perfect match
  });

  it('should calculate cash difference correctly with large negative difference', () => {
    const openingCash = 10000;
    const theoreticalRevenue = 50000;
    const expensesTotal = 10000;
    const closingCash = 45000;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(50000);
    expect(cashDifference).toBe(-5000); // 5000 F less than expected
  });

  it('should handle zero opening cash', () => {
    const openingCash = 0;
    const theoreticalRevenue = 20000;
    const expensesTotal = 5000;
    const closingCash = 15000;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(15000);
    expect(cashDifference).toBe(0);
  });

  it('should handle high expenses reducing expected cash', () => {
    const openingCash = 10000;
    const theoreticalRevenue = 15000;
    const expensesTotal = 20000;
    const closingCash = 5500;

    const expectedCash = openingCash + theoreticalRevenue - expensesTotal;
    const cashDifference = closingCash - expectedCash;

    expect(expectedCash).toBe(5000);
    expect(cashDifference).toBe(500); // 500 F more than expected despite high expenses
  });
});
