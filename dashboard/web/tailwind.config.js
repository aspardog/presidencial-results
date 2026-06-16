/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Global Bridge tokens
        'gb-ink': '#15252A',
        'gb-slate': '#3D5255',
        'gb-slate-muted': '#5E7074',
        'gb-teal': {
          50: '#F1F8F9',
          100: '#E4EFF1',
          200: '#CBE6EA',
          400: '#3FB6C2',
          600: '#2A8C99',
          700: '#15616D',
        },
        'gb-bg': '#F7F8F8',
        'gb-surface': '#FFFFFF',
        'gb-border': '#E4E9EA',
        'gb-border-strong': '#D2DADB',
        // Colores de partidos (paleta vibrante Global Bridge)
        'partido-defensores': '#1D4ED8',
        'partido-pacto': '#C2410C',
        'partido-cd': '#7C3AED',
        'partido-dignidad': '#0F766E',
        'partido-imparables': '#CA8A04',
        'partido-romper': '#BE185D',
        'partido-familia': '#0891B2',
        'partido-democrata': '#4F46E5',
        'partido-hierro': '#65A30D',
        'partido-fuerza': '#EA580C',
        'partido-ecologista': '#059669',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        'gb-sm': '6px',
        'gb-md': '10px',
        'gb-lg': '14px',
      },
      boxShadow: {
        'gb-sm': '0 1px 2px rgba(21,37,42,.05), 0 1px 1px rgba(21,37,42,.03)',
      },
    },
  },
  plugins: [],
}
