/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Dark warm luxurious canvas ──
        canvas: 'var(--bg-0)',
        'canvas-1': 'var(--bg-1)',
        surface: 'var(--glass)',
        'surface-2': 'rgba(255,255,255,0.03)',
        sunken: 'rgba(255,255,255,0.04)',

        line: 'var(--border)',
        'line-strong': 'rgba(255,255,255,0.14)',

        ink: {
          DEFAULT: 'var(--text)',
          soft: 'var(--muted)',
          faint: 'rgba(156,151,140,0.65)',
          ghost: 'rgba(156,151,140,0.35)',
        },

        // ── Champagne gold accent gradient ──
        accent: {
          DEFAULT: 'var(--a1)',
          bright: '#E0C07A',
          dim: 'var(--a2)',
          ink: 'var(--ink)',
          soft: 'rgba(212,177,106,0.10)',
          line: 'rgba(212,177,106,0.30)',
        },

        amber: {
          DEFAULT: '#D4B16A',
          soft: 'rgba(212,177,106,0.10)',
        },

        danger: {
          DEFAULT: '#DC2626',
          bright: '#EF4444',
          ink: '#FFFFFF',
          soft: 'rgba(220,38,38,0.12)',
          line: 'rgba(220,38,38,0.30)',
        },

        'glass-2': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem' }],
        meta: ['0.75rem', { lineHeight: '1.15rem' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        lead: ['1.0625rem', { lineHeight: '1.55', fontWeight: '400' }],
        'title-sm': ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        title: ['1.5rem', { lineHeight: '1.18', letterSpacing: '-0.02em', fontWeight: '600' }],
        display: ['clamp(1.875rem, 3.6vw, 2.5rem)', { lineHeight: '1.06', letterSpacing: '-0.03em', fontWeight: '600' }],
        hero: ['clamp(3rem, 5vw, 4.25rem)', { lineHeight: '1.04', letterSpacing: '-0.035em', fontWeight: '700' }],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        none: '0px',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
        card: '0 2px 8px rgba(0,0,0,0.30), 0 8px 24px -8px rgba(0,0,0,0.25)',
        lift: '0 12px 36px -16px rgba(0,0,0,0.45)',
        pop: '0 28px 70px -22px rgba(0,0,0,0.55)',
        focus: '0 0 0 3px rgba(212,177,106,0.25)',
        'gold-glow': '0 0 20px rgba(212,177,106,0.15), 0 0 40px rgba(212,177,106,0.08)',
        'gold-glow-sm': '0 0 12px rgba(212,177,106,0.12)',
        'gold-glow-lg': '0 0 30px rgba(212,177,106,0.20), 0 0 60px rgba(212,177,106,0.10)',
        glass: '0 8px 32px rgba(0,0,0,0.35)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'pulse-fast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-25px, 25px) scale(1.08)' },
          '66%': { transform: 'translate(35px, -15px) scale(0.92)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, 30px) scale(0.96)' },
          '66%': { transform: 'translate(-30px, -20px) scale(1.04)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'notch-expand': {
          from: { width: '160px' },
          to: { width: '200px' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        rise: 'rise 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'pop-in 0.18s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        'pulse-fast': 'pulse-fast 0.8s ease-in-out infinite',
        'dot-bounce': 'dot-bounce 1.2s ease-in-out infinite',
        float: 'float 20s ease-in-out infinite',
        'float-2': 'float-2 25s ease-in-out infinite',
        'float-3': 'float-3 22s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'notch-expand': 'notch-expand 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}
