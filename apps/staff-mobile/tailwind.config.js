/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          dark: '#1d4ed8',
        },
        emerald: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        warning: {
          DEFAULT: '#f59e0b',
        },
        brand: {
          blue: '#3b82f6',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        }
      },
    },
  },
  plugins: [],
};
