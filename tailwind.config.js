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
        'earth-darkbrown': '#5E4B3C',
        'earth-brown': '#8B7355',
        'earth-tan': '#BEA78C',
        'earth-sage': '#A4AC86',
        'earth-moss': '#6B7D5E',
        'earth-stone': '#4A4A48',
        'earth-cream': '#F5F2EB',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}