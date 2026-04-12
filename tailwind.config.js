/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA6C0A',
          700: '#C2550A',
          800: '#9A3C07',
          900: '#7C2D04',
        },
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        // was #F8F9FC

        accent: {
          purple: { DEFAULT: '#F3F0FF', text: '#7C3AED', icon: '#8B5CF6' },
          teal: { DEFAULT: '#F0FDF9', text: '#0F766E', icon: '#14B8A6' },
          orange: { DEFAULT: '#FFF7ED', text: '#C2410C', icon: '#F97316' },
          pink: { DEFAULT: '#FDF2F8', text: '#9D174D', icon: '#EC4899' },
          blue: { DEFAULT: '#EFF6FF', text: '#1D4ED8', icon: '#3B82F6' },
          green: { DEFAULT: '#F0FDF4', text: '#15803D', icon: '#22C55E' },
        },

        status: {
          en_attente: { DEFAULT: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
          validee: { DEFAULT: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
          en_traitement: { DEFAULT: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
          prete: { DEFAULT: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
          livree: { DEFAULT: '#F0FDF4', text: '#166534', border: '#86EFAC' },
          payee: { DEFAULT: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
          annulee: { DEFAULT: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
          retour: { DEFAULT: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
        },
      },

      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
        sidebar: '2px 0 12px rgba(0,0,0,0.06)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
        topbar: '0 1px 0 #F1F3F8',
      },

      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      },

      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        }
      },
    },
  },
  plugins: [],
};