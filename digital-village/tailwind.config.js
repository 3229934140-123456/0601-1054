/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#fef7ed',
          100: '#fdedd6',
          200: '#f9d6ac',
          300: '#f4b978',
          400: '#ee9243',
          500: '#ea761f',
          600: '#db5c15',
          700: '#b64514',
          800: '#913718',
          900: '#752f17',
        }
      },
    },
  },
  plugins: [],
}
