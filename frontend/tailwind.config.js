/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Questra design tokens — a quiet research desk with one vivid brand.
        'surface': '#fbfafc',
        'surface-dim': '#e6e3ec',
        'surface-bright': '#ffffff',
        'surface-lowest': '#ffffff',
        'surface-low': '#f7f6fb',
        'surface-container': '#f1eff7',
        'surface-high': '#eae8f2',
        'surface-highest': '#e3e0ee',
        'surface-variant': '#e3e0ee',

        'on-surface': '#14121a',
        'on-surface-variant': '#5b5769',
        'inverse-surface': '#14121a',
        'inverse-on-surface': '#f7f6fb',

        'outline': '#8b8799',
        'outline-variant': '#e8e6f0',

        // Brand — electric violet-indigo
        'primary': '#5b2be0',
        'on-primary': '#ffffff',
        'primary-container': '#6d40f0',
        'on-primary-container': '#ffffff',
        'primary-fixed': '#ede8ff',
        'primary-fixed-dim': '#d9cfff',
        'on-primary-fixed': '#1b0b52',
        'on-primary-fixed-variant': '#4318c9',
        'clay': {
          DEFAULT: '#5b2be0',
          deep: '#4318c9',
        },

        // Signal — mint, reserved for scores and confirmation
        'accent': '#0fd6a5',
        'accent-soft': '#d6fbef',
        'accent-ink': '#056b54',

        // Secondary — cool cyan (used sparingly)
        'secondary': '#0ea5b7',
        'on-secondary': '#ffffff',
        'secondary-container': '#b9eef4',
        'on-secondary-container': '#075863',
        'secondary-fixed': '#d6fbef',
        'secondary-fixed-dim': '#9fe9dc',
        'on-secondary-fixed': '#052e28',
        'on-secondary-fixed-variant': '#0b5a4c',

        'tertiary': '#a73400',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#ff7a45',
        'on-tertiary-container': '#43130a',

        'error': '#dc2626',
        'on-error': '#ffffff',
        'error-container': '#fee2e2',
        'on-error-container': '#7f1d1d',

        // Legacy aliases kept so older class names still resolve
        'paper': '#fbfafc',
        'panel': '#f1eff7',
        'surface-card': '#ffffff',
        'ink': {
          DEFAULT: '#14121a',
          soft: '#5b5769',
          faint: '#8b8799',
        },
        'line': {
          DEFAULT: '#e8e6f0',
          soft: '#f1eff7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-hero': ['44px', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '600' }],
        'headline-lg': ['30px', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-sm': ['17px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-technical': ['12px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-code-sm': ['11px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
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
        'composer': '0 1px 2px rgba(20, 18, 26, 0.04), 0 10px 30px -12px rgba(20, 18, 26, 0.18)',
        'card': '0 1px 2px rgba(20, 18, 26, 0.04), 0 4px 16px -8px rgba(20, 18, 26, 0.10)',
        'card-hover': '0 16px 40px -16px rgba(91, 43, 224, 0.22), 0 4px 12px -6px rgba(20, 18, 26, 0.08)',
        'pop': '0 24px 60px -20px rgba(20, 18, 26, 0.35)',
        'header': '0 1px 0 rgba(232, 230, 240, 1)',
        'xs': '0 1px 2px rgba(20, 18, 26, 0.05)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 0.68, 0.31, 1) both',
        'pulse-ring': 'pulse-ring 1.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
