import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        show: {
          '0%': { opacity: '0', width: '0', display: 'none' },
          '100%': { opacity: '1', width: '100%', display: 'flex' },
        },
        hide: {
          '0%': { opacity: '1', width: '100%', display: 'flex' },
          '100%': { opacity: '0', width: '0', display: 'none' },
        },
        showOpacity: {
          '0%': {
            transform: 'scale(2)',
            opacity: '0',
            display: 'none',
          },
          '50%': {
            transform: 'scale(1)',
            opacity: '1',
            display: 'flex',
          }
        },
        hiddenOpacity:{
          '0%': {
            transform: 'scale(1)',
            opacity: '1',
            display: 'flex',
          },
          '50%': {
            transform: 'scale(2)',
            opacity: '0',
            display: 'none',
          }
        }
      },
      animation: {
        show: 'show 0.3s ease-in-out forwards',
        hide: 'hide 0.3s ease-in-out forwards',
        showOpacity: 'showOpacity 1s cubic-bezier(0, 0, 0.2, 1) forwards',
        hiddenOpacity: 'hiddenOpacity 1s cubic-bezier(0, 0, 0.2, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
