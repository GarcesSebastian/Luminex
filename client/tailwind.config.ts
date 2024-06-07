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
        "deployment": {
					"0%": { opacity: "0.3", transform: "translateY(-30px)" },
					"100%": { opacity: "1", transform: "translateY(0px)" },
				},
        "deployment-invert": {
					"0%": { opacity: "1", transform: "translateY(0px)" },
					"100%": { opacity: "0.3", transform: "translateY(-30px)" },
				},
				"displace": {
					"0%": { transform: "translate(100%)" },
					"100%": { transform: "translate(0)" }
				},
				"spin-custom": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" }
				},
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
        "deployment": "deployment .3s ease-in-out",
        "deployment-invert": "deployment-invert .3s ease-in-out",
				"displace": "displace .5s ease-in-out forwards",
				"spin-custom": "spin-custom 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
