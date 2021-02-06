const colors = require('tailwindcss/colors')
module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: theme => ({
        'doodle-balloon': "url('/images/balloon.jpg')",
        'doodle-planets' : "url('https://image.freepik.com/vektoren-kostenlos/space-doodle_102902-2356.jpg')",
        'doodle-astro' : "url('/images/astro.jpg')",
        'colors' : "url('/images/colors.jpg')",
        'lines' : "url('/images/lines.PNG')",
        'lines-l' : "url('/images/linesLong.PNG')",
        'kasten' : "url('/images/kasten.PNG')",
        'comic-h' : "url('/images/comic1920Half.PNG')",
        'comic' : "url('/images/comic1920.png')",
        'pattern1' : "url('/images/Composition.jpg')",
      })
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      indigo: colors.indigo,
      red: colors.red,
      yellow: colors.yellow,
      coolGray: colors.coolGray,
      blueGray: colors.blueGray,
      trueGray: colors.trueGray,
      warmGray: colors.warmGray,
      orange: colors.orange,
      amber: colors.amber,
      lime: colors.lime,
      green: colors.green,
      emerald: colors.emerald,
      teal: colors.teal,
      cyan: colors.cyan,
      lightBlue: colors.lightBlue,
      blue: colors.blue,
      indigo: colors.indigo,
      violet: colors.violet,
      purple: colors.purple,
      fuchsia: colors.fuchsia,
      pink: colors.pink,
      rose: colors.rose,
    }
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
