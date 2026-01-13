/**
 * PDF Styles and Constants for Daily Activity Export
 */

// RAVITO Brand Colors
export const COLORS = {
  primary: '#F97316',      // Orange RAVITO
  success: '#16A34A',      // Green for positive values
  danger: '#DC2626',       // Red for negative values
  gray: '#6B7280',         // Gray for secondary text
  lightGray: '#F3F4F6',    // Light gray for alternating rows
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#1F2937',     // Dark gray for main text
} as const;

// Page Layout
export const PAGE = {
  margin: 20,              // 20mm margins
  width: 210,              // A4 width in mm
  height: 297,             // A4 height in mm
} as const;

// Font Sizes
export const FONTS = {
  title: 18,
  subtitle: 14,
  sectionTitle: 12,
  normal: 10,
  small: 8,
} as const;

// Table Styles
export const TABLE_STYLES = {
  head: {
    fillColor: COLORS.primary,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: FONTS.normal,
  },
  body: {
    fontSize: FONTS.normal,
    textColor: COLORS.darkGray,
  },
  alternateRow: {
    fillColor: COLORS.lightGray,
  },
} as const;

// Spacing
export const SPACING = {
  small: 5,
  medium: 10,
  large: 15,
} as const;
