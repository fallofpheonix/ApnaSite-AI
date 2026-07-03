import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBF1DE",
        ink: {
          DEFAULT: "#2B211A",
          soft: "#5A4A3A",
        },
        marigold: {
          DEFAULT: "#E8A33D",
          deep: "#C97F1E",
          soft: "#F6DCA8",
        },
        teal: {
          DEFAULT: "#1E5C58",
          deep: "#123C39",
        },
        brick: "#A8402B",
        card: "#FFFBF2",
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "var(--font-noto-serif-deva)", "serif"],
        sans: ["var(--font-karla)", "var(--font-noto-sans-deva)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
