/**
 * Centralized theme constants
 */

export const COLORS = {
  // Primary color (light blue)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main primary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Dark theme colors
  dark: {
    950: '#0a0a0a',  // Main background
    900: '#1a1a1a',  // Secondary background
    800: '#262626',  // Cards/elevated surfaces
    700: '#404040',  // Borders/dividers
    600: '#525252',
  },

  // Semantic colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#0ea5e9',
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const SPACING = {
  xs: '0.5rem',  // 8px
  sm: '0.75rem', // 12px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
};

export const BORDER_RADIUS = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
};

export default {
  COLORS,
  BREAKPOINTS,
  SPACING,
  BORDER_RADIUS,
};
