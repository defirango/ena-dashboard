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
        // Status palette — validated for colorblind-safety + contrast (never used alone; always paired with icon + label)
        status: {
          good: '#0ca30c',
          watch: '#fab219',
          danger: '#d03b3b'
        },
        // Sequential / categorical chart colors
        chart: {
          blue: '#2a78d6',
          orange: '#eb6834',
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
