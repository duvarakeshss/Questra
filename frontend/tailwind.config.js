/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch design system — Questra Multimodal Search Workspace
        // Surface architecture
        'surface': '#fbf8fc',
        'surface-dim': '#dcd9dd',
        'surface-bright': '#fbf8fc',
        'surface-lowest': '#ffffff',
        'surface-low': '#f6f2f7',
        'surface-container': '#f0edf1',
        'surface-high': '#eae7eb',
        'surface-highest': '#e4e1e6',
        'surface-variant': '#e4e1e6',

        // On-surface text
        'on-surface': '#1b1b1e',
        'on-surface-variant': '#434655',
        'inverse-surface': '#303033',
        'inverse-on-surface': '#f3f0f4',

        // Borders / outlines
        'outline': '#747686',
        'outline-variant': '#c4c5d7',

        // Primary — Electric Cobalt
        'primary': '#0037b0',
        'on-primary': '#ffffff',
        'primary-container': '#1d4ed8',
        'on-primary-container': '#cad3ff',
        'primary-fixed': '#dce1ff',
        'primary-fixed-dim': '#b7c4ff',
        'on-primary-fixed': '#001551',
        'on-primary-fixed-variant': '#0039b5',

        // Secondary — Technical Cerulean
        'secondary': '#006398',
        'on-secondary': '#ffffff',
        'secondary-container': '#5bb8fe',
        'on-secondary-container': '#00476e',
        'secondary-fixed': '#cce5ff',
        'secondary-fixed-dim': '#93ccff',
        'on-secondary-fixed': '#001d31',
        'on-secondary-fixed-variant': '#004b73',

        // Tertiary
        'tertiary': '#7f2500',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#a73400',
        'on-tertiary-container': '#ffc9b7',

        // Error
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Legacy aliases for backward-compat with existing component code
        'paper': '#fbf8fc',
        'panel': '#f0edf1',
        'surface-card': '#ffffff',
        'ink': {
          DEFAULT: '#1b1b1e',
          soft: '#434655',
          faint: '#747686',
        },
        'line': {
          DEFAULT: '#c4c5d7',
          soft: '#e4e1e6',
        },
        'clay': {
          DEFAULT: '#1d4ed8',
          deep: '#0037b0',
        },
      },
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
        serif: ['"Hanken Grotesk"', 'Georgia', 'ui-serif', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-hero': ['48px', { lineHeight: '54px', letterSpacing: '-0.03em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '500' }],
        'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0.005em', fontWeight: '400' }],
        'label-technical': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }],
        'label-code-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        'gutter': '1rem',
        'gutter-desktop': '1.5rem',
        'margin': '1rem',
        'margin-tablet': '1.5rem',
        'margin-desktop': '2.5rem',
      },
      boxShadow: {
        'composer': '0 1px 2px rgba(27, 27, 30, 0.04), 0 4px 12px rgba(27, 27, 30, 0.03)',
        'card': '0 1px 2px rgba(27, 27, 30, 0.04), 0 4px 12px rgba(27, 27, 30, 0.03)',
        'card-hover': '0 12px 32px -4px rgba(27, 27, 30, 0.08), 0 4px 12px -2px rgba(27, 27, 30, 0.03)',
        'pop': '0 8px 28px -12px rgba(27, 27, 30, 0.22)',
        'header': '0 1px 8px rgba(0,0,0,0.04)',
        'xs': '0 1px 2px rgba(27,27,30,0.05)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.3s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'slide-in-left': 'slide-in-left 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
