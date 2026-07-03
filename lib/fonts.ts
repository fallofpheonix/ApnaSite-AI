import {
  Newsreader,
  Cormorant,
  Barlow_Condensed,
  Barlow,
  Bricolage_Grotesque,
  Karla,
  Fraunces,
  Sora,
  Marcellus,
  Noto_Serif_Devanagari,
  Noto_Sans_Devanagari,
} from "next/font/google";

// Every font the app can use is loaded once, up front, as a self-hosted
// CSS variable. Theme configs (see lib/theme.ts) reference fonts by their
// public Google Fonts family name; resolveFontStack() below maps that name
// to the matching variable for the live React preview. The static HTML
// export (lib/renderSite.ts) instead links these same families straight
// from Google Fonts, since it's a standalone document outside the Next.js
// asset pipeline.

export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

export const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-karla",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

// Marcellus ships in a single 400 weight - it's an engraved-caps display face.
export const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

// Devanagari fallbacks. These are appended after the primary Latin font in
// every font stack, so Latin glyphs render in the chosen display/body face
// while Devanagari glyphs (which that face doesn't include) automatically
// fall through to a proper, legible Devanagari typeface instead of tofu
// boxes or the browser's generic system serif/sans.
export const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-deva",
  display: "swap",
});

export const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-deva",
  display: "swap",
});

export const fontVariableClassNames = [
  newsreader.variable,
  cormorant.variable,
  barlowCondensed.variable,
  barlow.variable,
  bricolage.variable,
  karla.variable,
  fraunces.variable,
  sora.variable,
  marcellus.variable,
  notoSerifDevanagari.variable,
  notoSansDevanagari.variable,
].join(" ");

const FONT_VAR_BY_NAME: Record<string, string> = {
  Newsreader: "var(--font-newsreader)",
  Cormorant: "var(--font-cormorant)",
  "Barlow Condensed": "var(--font-barlow-condensed)",
  Barlow: "var(--font-barlow)",
  "Bricolage Grotesque": "var(--font-bricolage)",
  Karla: "var(--font-karla)",
  Fraunces: "var(--font-fraunces)",
  Sora: "var(--font-sora)",
  Marcellus: "var(--font-marcellus)",
};

const DEVANAGARI_VAR: Record<"display" | "body", string> = {
  display: "var(--font-noto-serif-deva)",
  body: "var(--font-noto-sans-deva)",
};

/** Resolves a theme's public font family name to a full CSS font-family
 * stack (self-hosted var + Devanagari fallback + generic), for use in the
 * live React preview. */
export function resolveFontStack(
  publicFamilyName: string,
  role: "display" | "body"
): string {
  const primary = FONT_VAR_BY_NAME[publicFamilyName] ?? `"${publicFamilyName}"`;
  const generic = role === "display" ? "serif" : "sans-serif";
  return `${primary}, ${DEVANAGARI_VAR[role]}, ${generic}`;
}

// All families + weights referenced by any theme, for the static HTML
// export's Google Fonts <link>. Deliberately loads every family rather than
// computing a per-theme subset - simpler and more robust for a prototype,
// at the cost of a heavier font payload than a production build would want.
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600",
    "family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600",
    "family=Barlow+Condensed:wght@500;600;700",
    "family=Barlow:wght@400;500;600",
    "family=Bricolage+Grotesque:wght@400;500;600;700",
    "family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400",
    "family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600",
    "family=Sora:wght@400;500;600;700",
    "family=Marcellus",
    "family=Noto+Serif+Devanagari:wght@400;500;600;700",
    "family=Noto+Sans+Devanagari:wght@400;500;600;700",
  ].join("&") +
  "&display=swap";

/** Static-export font-family stack: public family name + Devanagari fallback. */
export function staticFontStack(
  publicFamilyName: string,
  role: "display" | "body"
): string {
  const generic = role === "display" ? "serif" : "sans-serif";
  const devanagari = role === "display" ? "Noto Serif Devanagari" : "Noto Sans Devanagari";
  return `'${publicFamilyName}', '${devanagari}', ${generic}`;
}
