/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#42B7F0',
        'primary-purple': '#AF9FD4',
        'primary-white': '#FEFEFE',
        'primary-light': '#E8F4FD',
        'primary-dark': '#2A3F54',
      },
    },
  },
  plugins: [],
}
