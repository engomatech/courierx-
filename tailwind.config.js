/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Brand accent — unified indigo across ops / admin / portal.
        // Landing keeps its own amber marketing palette.
        brand: {
          50 : '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      boxShadow: {
        // Reference-style soft shadows — used on cards and dropdowns.
        'soft-sm': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)',
        'soft'   : '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'soft-lg': '0 10px 25px -12px rgba(15, 23, 42, 0.15), 0 4px 10px -4px rgba(15, 23, 42, 0.08)',
        'soft-xl': '0 20px 40px -20px rgba(15, 23, 42, 0.20), 0 8px 16px -6px rgba(15, 23, 42, 0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'toast-in': {
          '0%'  : { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%'  : { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'skeleton-shimmer': {
          '0%'  : { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
      animation: {
        'toast-in': 'toast-in 180ms ease-out',
        'fade-in' : 'fade-in 140ms ease-out',
        'shimmer' : 'skeleton-shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
