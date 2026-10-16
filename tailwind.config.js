/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        ink: {
          DEFAULT: '#302238',
          muted: '#6B5D72',
          soft: '#5E5066',
          nav: '#8A7D90',
        },
        coral: {
          DEFAULT: '#EF7564',
          dark: '#D9604F',
          text: '#B8473A',
        },
        lilac: {
          DEFAULT: '#EAE2F4',
          bg: '#F6F1FA',
          line: '#C9BCD6',
        },
        green: {
          DEFAULT: '#557A65',
          bg: '#E3ECE5',
          text: '#2F4B3B',
        },
        sand: {
          DEFAULT: '#F3EDE4',
          2: '#EFE8DE',
        },
        line: {
          DEFAULT: '#E9E2D8',
          2: '#E2D8CB',
          3: '#D9CFC2',
        },
        danger: {
          bg: '#FBE3DF',
          text: '#8E3427',
        },
        demo: {
          bg: '#FFF3D6',
          text: '#5B4A1E',
        },
        page: '#EFE7DB',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 14px rgba(48,34,56,.06)',
        'card-md': '0 2px 14px rgba(48,34,56,.05)',
        hero: '0 18px 40px -18px rgba(48,34,56,.6)',
        cta: '0 10px 24px -10px rgba(48,34,56,.6)',
        create: '0 10px 22px -8px rgba(239,117,100,.8)',
        toast: '0 12px 28px -10px rgba(29,21,32,.6)',
        'save-btn': '0 2px 8px rgba(0,0,0,.15)',
      },
      borderRadius: {
        '10': '10px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '18': '18px',
        '20': '20px',
        '22': '22px',
        '24': '24px',
        '28': '28px',
        '30': '30px',
      },
      keyframes: {
        glspin: {
          from: { transform: 'rotateX(-20deg) rotateY(0deg)' },
          to: { transform: 'rotateX(-20deg) rotateY(360deg)' },
        },
        glfloat: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        glpulse: {
          '0%,100%': { opacity: '.45' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        giftspin: 'glspin 9s linear infinite',
        float: 'glfloat 4s ease-in-out infinite',
        pulse: 'glpulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
