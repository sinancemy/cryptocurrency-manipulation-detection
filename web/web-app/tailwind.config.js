module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#0C0E11",
        },
        yellow: {
          50: "#F6C14E",
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
