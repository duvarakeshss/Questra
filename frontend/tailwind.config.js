/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Claude-inspired — warm ivory paper, terracotta/coral brand, ink text.
        'surface': '#f5f4ef',
        'surface-dim': '#ecebe3',
        'surface-bright': '#ffffff',
        'surface-lowest': '#ffffff',
        'surface-low': '#faf9f5',
        'surface-container': '#f0eee6',
        'surface-high': '#e9e7dd',
        'surface-highest': '#dedbd1',
        'surface-variant': '#e9e7dd',

        'on-surface': '#191919',
        'on-surface-variant': '#6b6a63',
        'inverse-surface': '#262624',
        'inverse-on-surface': '#f0eee6',

        'outline': '#cbc8bc',
        'outline-variant': '#e5e3d9',

        // Brand — Claude coral / terracotta
        'primary': '#d97757',
        'on-primary': '#ffffff',
        'primary-container': '#c96442',
        'on-primary-container': '#ffffff',
        'primary-fixed': '#f8e6de',
        'primary-fixed-dim': '#f1d2c5',
        'on-primary-fixed': '#592a18',
        'on-primary-fixed-variant': '#b8512f',
        'clay': {
          DEFAULT: '#d97757',
          deep: '#c15f3c',
        },

        // Signal — warm amber, reserved for scores and confidence
        'accent': '#a8701a',
        'accent-soft': 'rgba(168, 112, 26, 0.14)',
        'accent-ink': '#8a5a12',

        'secondary': '#8a7f72',
        'on-secondary': '#ffffff',
        'secondary-container': '#efebe2',
        'on-secondary-container': '#3d3b35',
        'secondary-fixed': '#f5f2ea',
        'secondary-fixed-dim': '#e9e5da',
        'on-secondary-fixed': '#2a2925',
        'on-secondary-fixed-variant': '#5a574f',

        'tertiary': '#a9805a',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#f0e6da',
        'on-tertiary-container': '#4a3423',

        'error': '#bf4d3b',
        'on-error': '#ffffff',
        'error-container': '#fbe4df',
        'on-error-container': '#7a2a1c',

        // Legacy aliases kept so older class names still resolve
        'paper': '#f5f4ef',
        'panel': '#faf9f5',
        'surface-card': '#ffffff',
        'ink': {
          DEFAULT: '#191919',
          soft: '#6b6a63',
          faint: '#9a988e',
        },
        'line': {
          DEFAULT: '#e5e3d9',
          soft: '#efebe2',
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
        'composer': '0 1px 0 rgba(255,255,255,0.9) inset, 0 22px 50px -26px rgba(74,60,48,0.4)',
        'card': '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 30px -20px rgba(74,60,48,0.32)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.95) inset, 0 22px 48px -24px rgba(217,119,87,0.5)',
        'pop': '0 1px 0 rgba(255,255,255,0.9) inset, 0 34px 80px -32px rgba(74,60,48,0.5)',
        'header': '0 1px 0 rgba(255,255,255,0.6)',
        'glow': '0 0 36px -10px rgba(217, 119, 87, 0.55)',
        'xs': '0 1px 2px rgba(74,60,48,0.2)',
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
