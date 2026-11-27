/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070F',
        panel: '#0B1220',
        line: '#334155',
        aria: {
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          lime: '#A3E635',
          amber: '#FBBF24',
          rose: '#FB7185',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,.25), 0 0 40px -12px rgba(34,211,238,.55)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(34,211,238,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.06) 1px, transparent 1px)',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-18px,0) scale(1.04)' },
        },
        spotlight: {
          '0%': { opacity: 0, transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -40%) scale(1)' },
        },
      },
      animation: {
        drift: 'drift 12s ease-in-out infinite',
        spotlight: 'spotlight 2s ease .4s 1 forwards',
      },
    },
  },
  plugins: [],
};
