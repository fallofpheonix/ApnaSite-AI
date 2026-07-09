import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
        },
        marigold: {
          DEFAULT: "var(--color-marigold)",
          deep: "var(--color-marigold-deep)",
          soft: "var(--color-marigold-soft)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          deep: "var(--color-teal-deep)",
        },
        brick: "var(--color-brick)",
        card: "var(--color-card)",
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
