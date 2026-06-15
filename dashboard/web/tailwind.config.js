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
        // Colores de partidos
        'partido-defensores': '#1E40AF',
        'partido-pacto': '#DC2626',
        'partido-cd': '#7C3AED',
        'partido-dignidad': '#059669',
        'partido-imparables': '#F59E0B',
        'partido-romper': '#EC4899',
        'partido-familia': '#14B8A6',
        'partido-democrata': '#6366F1',
        'partido-hierro': '#84CC16',
        'partido-fuerza': '#F97316',
        'partido-ecologista': '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
