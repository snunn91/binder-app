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
    container: {
      center: true, // Centers the container
      padding: "2rem", // Adds horizontal padding (adjust as needed)
      screens: {
        sm: "720px", // Wider than the default 640px
        md: "860px", // Wider than the default 768px
        lg: "1120px", // Wider than the default 1024px
        xl: "1400px", // Wider than the default 1280px
        "2xl": "1800px", // Wider than the default 1536px
      },
    },
  },
} satisfies Config;
