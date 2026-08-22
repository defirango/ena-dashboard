/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Status palette, muted on purpose. Paired with a label, never used alone.
        status: {
          good: '#4a7062',
          watch: '#8a7248',
          danger: '#8f5049'
        },
        // Categorical chart colors, muted to match the rest of the dashboard
        chart: {
          blue: '#4a6f9e',
          orange: '#a97452',
          surface: '#fcfcfb',
          surfaceDark: '#1a1a19'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
