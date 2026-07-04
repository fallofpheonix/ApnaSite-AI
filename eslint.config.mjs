import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Flat config (ESLint 9). `next lint` is deprecated — npm run lint calls the
// ESLint CLI directly; eslint-config-next ≥16 is flat-native.
const config = [
  {
    ignores: [".next/**", "node_modules/**", "uploads/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // The Web Speech API and Razorpay checkout globals have no useful
      // types; the few `any`s in those adapters are deliberate.
      "@typescript-eslint/no-explicit-any": "warn",
      // Flags our feature-detection (speech support must be probed client-
      // side to avoid hydration mismatch) and fetch-on-mount patterns. The
      // real fix is moving data fetching to server components — tracked as
      // a later refactor, not a lint suppression per line.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
