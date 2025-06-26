/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'earth-darkbrown': '#3C2F2F',
        'earth-brown': '#6D4C41',
        'earth-sage': '#B5CBB7',
        'earth-moss': '#A8BFA3',
        'earth-cream': '#F5F3EA',
        'earth-stone': '#A7A9A6',
      },
    },
  },
  plugins: [],
}