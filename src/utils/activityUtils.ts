/**
 * Utility functions for activity management
 */

/**
 * Format currency in FCFA (West African CFA franc)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Constants for date calculations
 */
export const DAYS_IN_YEAR = {
  NORMAL: 365,
  LEAP: 366,
} as const;

/**
 * Check if year is leap year
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Get number of days in a year
 */
export const getDaysInYear = (year: number): number => {
  return isLeapYear(year) ? DAYS_IN_YEAR.LEAP : DAYS_IN_YEAR.NORMAL;
};

/**
 * Get month name in French
 */
export const getMonthName = (month: number): string => {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long' });
};

/**
 * Format month name to short version (first 3 letters, capitalized)
 */
export const formatMonthShort = (monthName: string): string => {
  return monthName.charAt(0).toUpperCase() + monthName.substring(1, 3).toLowerCase();
};

/**
 * Calculate percentage evolution between two values
 */
export const calculateEvolution = (
  current: number, 
  previous?: number
): { value: number; isPositive: boolean } | null => {
  if (!previous || previous === 0) return null;
  const evolution = ((current - previous) / previous) * 100;
  return { value: Math.abs(evolution), isPositive: evolution >= 0 };
};

/**
 * Get expense category label safely
 */
export const getCategoryLabel = (
  category: string, 
  categories: Record<string, string>
): string => {
  return categories[category] ?? category;
};
