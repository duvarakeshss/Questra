/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Questra — "violet obsidian": layered depth, brand violet, gold for confidence.
        'surface': '#08070f',
        'surface-dim': '#050408',
        'surface-bright': '#1b1733',
        'surface-lowest': '#0e0c18',
        'surface-low': '#141126',
        'surface-container': '#1a1630',
        'surface-high': '#221d3c',
        'surface-highest': '#2a2448',
        'surface-variant': '#2a2448',

        'on-surface': '#efeaff',
        'on-surface-variant': '#a49dc6',
        'inverse-surface': '#050409',
        'inverse-on-surface': '#efeaff',

        'outline': '#4a4472',
        'outline-variant': '#272143',

        // Brand — electric violet
        'primary': '#7c5cff',
        'on-primary': '#ffffff',
        'primary-container': '#6b48f5',
        'on-primary-container': '#ffffff',
        'primary-fixed': '#1e1840',
        'primary-fixed-dim': '#2a2255',
        'on-primary-fixed': '#e7e0ff',
        'on-primary-fixed-variant': '#c9bcff',
        'clay': {
          DEFAULT: '#7c5cff',
          deep: '#6a48e6',
        },

        // Signal — gold, reserved for scores and confidence
        'accent': '#f5b544',
        'accent-soft': 'rgba(245, 181, 68, 0.16)',
        'accent-ink': '#f7c46a',

        'secondary': '#c4b5fd',
        'on-secondary': '#1a1040',
        'secondary-container': '#241d47',
        'on-secondary-container': '#ded4ff',
        'secondary-fixed': '#1b1638',
        'secondary-fixed-dim': '#2a2350',
        'on-secondary-fixed': '#e9e2ff',
        'on-secondary-fixed-variant': '#c9bcff',

        'tertiary': '#ff8a5c',
        'on-tertiary': '#2a1206',
        'tertiary-container': '#3a1c0e',
        'on-tertiary-container': '#ffd9c7',

        'error': '#ff6b7a',
        'on-error': '#2a0710',
        'error-container': '#3a1420',
        'on-error-container': '#ffd6db',

        // Legacy aliases kept so older class names still resolve
        'paper': '#08070f',
        'panel': '#141126',
        'surface-card': '#0e0c18',
        'ink': {
          DEFAULT: '#efeaff',
          soft: '#a49dc6',
          faint: '#6f6890',
        },
        'line': {
          DEFAULT: '#272143',
          soft: '#1a1630',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-hero': ['clamp(2.5rem, 6vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.04em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.15', letterSpacing: '-0.035em', fontWeight: '700' }],
        'headline-md': ['23px', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-sm': ['17px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.65', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-technical': ['12px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-code-sm': ['11px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        'space-xs': '0.375rem',
        'space-sm': '0.625rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.25rem',
        'gutter': '1rem',
        'gutter-desktop': '1.5rem',
        'margin': '1rem',
        'margin-tablet': '1.5rem',
        'margin-desktop': '2.5rem',
      },
      boxShadow: {
        'composer': '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 60px -24px rgba(0,0,0,0.85)',
        'card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 14px 34px -20px rgba(0,0,0,0.9)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.06) inset, 0 26px 60px -26px rgba(124,92,255,0.5)',
        'pop': '0 1px 0 rgba(255,255,255,0.05) inset, 0 40px 90px -30px rgba(0,0,0,0.95)',
        'header': '0 1px 0 rgba(255,255,255,0.05)',
        'glow': '0 0 40px -8px rgba(124, 92, 255, 0.6)',
        'xs': '0 1px 2px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-2%,0) scale(1.06)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'drift': 'drift 16s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
