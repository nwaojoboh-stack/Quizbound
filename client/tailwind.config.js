/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          soft: '#12121a',
          card: '#181824',
          elevated: '#1f1f2e',
        },
        brand: {
          DEFAULT: '#7c3aed',
          50: '#f5f3ff',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        accent: {
          DEFAULT: '#22d3ee',
          glow: '#06b6d4',
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124, 58, 237, 0.6)',
        'glow-accent': '0 0 40px -8px rgba(34, 211, 238, 0.6)',
        'glow-danger': '0 0 50px -6px rgba(239, 68, 68, 0.7)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(124,58,237,0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 24px rgba(124,58,237,0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(124,58,237,0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.66, 0, 0, 1) infinite',
      },
    },
  },
  plugins: [],
}
