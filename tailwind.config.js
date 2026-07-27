/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          DEFAULT: '#070913',
          card: 'rgba(18, 24, 43, 0.75)',
        },
      },
    },
  },
  plugins: [],
}
