/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RAVITO "Soleil d'Afrique" Color Palette
        primary: {
          DEFAULT: '#F97316', // orange-500
          light: '#FB923C', // orange-400
          dark: '#EA580C', // orange-600
        },
        secondary: {
          DEFAULT: '#10B981', // emerald-500
          light: '#34D399', // emerald-400
          dark: '#059669', // emerald-600
        },
        accent: {
          DEFAULT: '#F59E0B', // amber-500
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'orange-sm': '0 2px 8px rgba(249, 115, 22, 0.15)',
        'orange-md': '0 4px 12px rgba(249, 115, 22, 0.25)',
        'orange-lg': '0 8px 24px rgba(249, 115, 22, 0.35)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
