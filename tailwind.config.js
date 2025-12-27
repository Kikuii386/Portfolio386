/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- ✅ ส่วนที่แก้ไข: ใช้สูตร RGB + Alpha Value ---
        'earth-darkbrown': 'rgb(var(--earth-darkbrown) / <alpha-value>)',
        'earth-brown': 'rgb(var(--earth-brown) / <alpha-value>)',
        'earth-tan': 'rgb(var(--earth-tan) / <alpha-value>)',
        'earth-sage': 'rgb(var(--earth-sage) / <alpha-value>)',
        'earth-cream': 'rgb(var(--earth-cream) / <alpha-value>)',
        'earth-primary': 'rgb(var(--earth-primary) / <alpha-value>)',

        // --- 🟤 ส่วนที่คงเดิม (ไม่ได้เปลี่ยนธีมตามคริสต์มาส) ---
        'earth-moss': '#6B7D5E',
        'earth-stone': '#C7BFB1',
        'earth-olive': '#7A8B5A',
        'earth-creammy': '#ebe5d7',
        'earth-creamlight': '#FAF6F2',
        'earth-flax': '#FFE6A7',
        'earth-clay': '#99582A',
        'earth-tanlight': '#BB9457',
        'earth-amberlight': '#D4A373',
        'earth-haze': '#FAEDCD',
        'earth-mist': '#E9EDC9',
        'earth-sageleaf': '#CCD5AE',
        'earth-brownmedium': '#5A4428',
        'earth-softcream': '#F7E7C3',

        // --- Shadcn & System Colors ---
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'slide-in-from-bottom': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
