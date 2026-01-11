import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", "dark"],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        exo: ["Montserrat", "sans-serif"],
      },
    },
  },
} satisfies Config;
