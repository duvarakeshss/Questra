/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Warm editorial instrument" — paper stock, ink rules, one coral signal.
        'surface': '#f3efe6',
        'surface-dim': '#eae5d9',
        'surface-bright': '#fffdf9',
        'surface-lowest': '#fffdf9',
        'surface-low': '#faf7f0',
        'surface-container': '#efeae0',
        'surface-high': '#e6e0d3',
        'surface-highest': '#dcd5c6',
        'surface-variant': '#e6e0d3',

        'on-surface': '#1c1a16',
        'on-surface-variant': '#6b6558',
        'inverse-surface': '#262320',
        'inverse-on-surface': '#f3efe6',

        'outline': '#c4bcab',
        'outline-variant': '#ddd7c9',

        // Signal — deep coral, used sparingly (active rules, markers, scores)
        'primary': '#c8613c',
        'on-primary': '#fffdf9',
        'primary-container': '#a94c2b',
        'on-primary-container': '#fffdf9',
        'primary-fixed': '#f4e2d9',
        'primary-fixed-dim': '#e8cdbf',
        'on-primary-fixed': '#4a2312',
        'on-primary-fixed-variant': '#a94c2b',
        'clay': {
          DEFAULT: '#c8613c',
          deep: '#a94c2b',
        },

        // Ink — the action color for filled controls
        'ink': {
          DEFAULT: '#1c1a16',
          soft: '#6b6558',
          faint: '#9a9384',
          rule: '#ddd7c9',
        },

        // Legacy signal aliases kept so older class names still resolve
        'accent': '#a94c2b',
        'accent-soft': 'rgba(200, 97, 60, 0.12)',
        'accent-ink': '#8f3f22',

        'secondary': '#6b6558',
        'on-secondary': '#fffdf9',
        'secondary-container': '#efeae0',
        'on-secondary-container': '#3d3a33',
        'secondary-fixed': '#f5f2ea',
        'secondary-fixed-dim': '#e9e4d8',
        'on-secondary-fixed': '#26241f',
        'on-secondary-fixed-variant': '#555045',

        'tertiary': '#6b6558',
        'on-tertiary': '#fffdf9',
        'tertiary-container': '#efeae0',
        'on-tertiary-container': '#3d3a33',

        'error': '#a63d2b',
        'on-error': '#fffdf9',
        'error-container': '#f6e3de',
        'on-error-container': '#6f2415',

        // Legacy aliases kept so older class names still resolve
        'paper': '#f3efe6',
        'panel': '#faf7f0',
        'surface-card': '#fffdf9',
        'line': {
          DEFAULT: '#ddd7c9',
          soft: '#e9e4d8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-hero': ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '700' }],
        'headline-lg': ['30px', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-md': ['22px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-sm': ['17px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.7', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.62', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.55', fontWeight: '400' }],
        'eyebrow': ['11px', { lineHeight: '1.3', letterSpacing: '0.18em', fontWeight: '600' }],
        'label-technical': ['12px', { lineHeight: '1.3', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-code-sm': ['11px', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '5px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
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
        // Flat paper: depth comes from rules, not shadows.
        'composer': 'none',
        'card': 'none',
        'card-hover': 'none',
        'header': 'none',
        'glow': 'none',
        'xs': 'none',
        'pop': '0 20px 44px -26px rgba(28, 26, 22, 0.4)',
        'rule': '0 1px 0 rgba(28, 26, 22, 0.07)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out both',
        'fade-up': 'fade-up 0.28s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 0.68, 0.31, 1) both',
      },
    },
  },
  plugins: [],
}
