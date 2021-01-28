module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      height: ['focus'],
    }
  },
  plugins: [
    require("tailwindcss-hyphens")
  ],
}
