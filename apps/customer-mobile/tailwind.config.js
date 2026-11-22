/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['GoogleSans-Regular'],
        normal: ['GoogleSans-Regular'],
        medium: ['GoogleSans-Medium'],
        semibold: ['GoogleSans-SemiBold'],
        bold: ['GoogleSans-Bold'],
        extrabold: ['GoogleSans-Bold'],
        italic: ['GoogleSans-Italic'],
      },
      fontWeight: {
        semibold: 'normal',
      },
      colors: {
        primary: {
          DEFAULT: '#215cd4',
          hover: '#194cb5',
          dark: '#163b86',
        },
        emerald: {
          DEFAULT: '#10b780',
          500: '#10b780',
        },
        warning: {
          DEFAULT: '#c58b12',
        },
        brand: {
          blue: '#215cd4',
          dark: '#1e1e1e',
          gray: '#f8f8f8',
        }
      },
    },
  },
  plugins: [],
};

