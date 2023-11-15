import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gradientT: "#27272A",
        gradientB: "#18181B",
        titleText: "#EDF2EF",
        cinereous: "#584D4B",
        powder: "#FBFEF9"
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"]
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
} satisfies Config;
