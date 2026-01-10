import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        exo: ["Montserrat", "sans-serif"],
      },
      // backgroundImage: {
      //   "dark-card-gradient": "linear-gradient(to right, #605C3C, #3C3B3F)",
      // },
    },
  },
} satisfies Config;
