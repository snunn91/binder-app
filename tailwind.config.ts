import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        exo: ["Montserrat", "sans-serif"],
      },
    },
  },
} satisfies Config;
