module.exports = {
//  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#0C0E11",
          60: "#272F3E",
          128: "#3b6978",
        },
        yellow: {
          50: "#F6C14E",
        },
        gray: {
          780: "#252F3E",
          850: "#18202f",
        }
      },
      minHeight: {
        '16':  '4rem',
        '20': '5rem'
      },
      spacing: {
        128: "36rem",
      },
      keyframes: {
        'fade-in-down': {
            '0%': {
                opacity: '0',
                transform: 'translateY(-10px)'
            },
            '100%': {
                opacity: '1',
                transform: 'translateY(0)'
            },
        },
        'blur-in': {
          '0%': {
            opacity: '1',
            filter: 'blur(3px)'
          },
          '100%': {
              opacity: '1',
              filter: 'blur(0px)'
          },
        }
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'blur-in': 'blur-in 0.2s ease-out'
      }
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled', 'hover'],
      visibility: ['hover']
    },
  },
  plugins: [],
};
