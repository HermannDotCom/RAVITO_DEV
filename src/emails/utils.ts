/**
 * Email Template Utilities
 * Shared helper functions for email templates
 */

/**
 * Format amount in FCFA with French number formatting
 * @param amount - Amount to format
 * @returns Formatted string with thousand separators
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to French format
 * @param date - Date to format
 * @returns Formatted date string (e.g., "15 décembre 2024")
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/**
 * Format time to French format
 * @param date - Date to format
 * @returns Formatted time string (e.g., "14h30")
 */
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(':', 'h');
};

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
