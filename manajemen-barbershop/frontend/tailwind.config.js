/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        barber: {
          50: '#f7f6f4',
          100: '#edebe4',
          200: '#ded9cd',
          300: '#c7beac',
          400: '#ab9d85',
          500: '#948369',
          600: '#7a6a52',
          700: '#60523f',
          800: '#4a3f31',
          900: '#2b241c',
          950: '#15110d',
        },
        gold: {
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
        }
      }
    },
  },
  plugins: [],
}
