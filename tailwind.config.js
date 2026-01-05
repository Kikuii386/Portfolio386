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
        // --- Main Colors ---
        'earth-primary': 'rgb(var(--earth-primary) / <alpha-value>)',
        'earth-darkbrown': 'rgb(var(--earth-darkbrown) / <alpha-value>)',
        'earth-brown': 'rgb(var(--earth-brown) / <alpha-value>)',
        'earth-tan': 'rgb(var(--earth-tan) / <alpha-value>)',
        'earth-sage': 'rgb(var(--earth-sage) / <alpha-value>)',
        'earth-cream': 'rgb(var(--earth-cream) / <alpha-value>)',

        // --- Extended Earth Tones (แปลงให้เข้า Format แล้ว) ---
        'earth-moss': 'rgb(var(--earth-moss) / <alpha-value>)',
        'earth-stone': 'rgb(var(--earth-stone) / <alpha-value>)',
        'earth-olive': 'rgb(var(--earth-olive) / <alpha-value>)',
        'earth-creammy': 'rgb(var(--earth-creammy) / <alpha-value>)',
        'earth-creamlight': 'rgb(var(--earth-creamlight) / <alpha-value>)',
        'earth-flax': 'rgb(var(--earth-flax) / <alpha-value>)',
        'earth-clay': 'rgb(var(--earth-clay) / <alpha-value>)',
        'earth-tanlight': 'rgb(var(--earth-tanlight) / <alpha-value>)',
        'earth-amberlight': 'rgb(var(--earth-amberlight) / <alpha-value>)',
        'earth-haze': 'rgb(var(--earth-haze) / <alpha-value>)',
        'earth-mist': 'rgb(var(--earth-mist) / <alpha-value>)',
        'earth-sageleaf': 'rgb(var(--earth-sageleaf) / <alpha-value>)',
        'earth-brownmedium': 'rgb(var(--earth-brownmedium) / <alpha-value>)',
        'earth-softcream': 'rgb(var(--earth-softcream) / <alpha-value>)',

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
