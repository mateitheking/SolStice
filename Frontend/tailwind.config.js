/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        card: '#18181B',
        muted: '#27272A',
        accent: '#22C55E',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};
