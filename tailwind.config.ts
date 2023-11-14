import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gradientT: "#27272A",
        gradientB: "#18181B"
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
