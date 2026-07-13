import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listThemes } from "@/lib/theme";

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = channel(parseInt(value.slice(0, 2), 16));
  const g = channel(parseInt(value.slice(2, 4), 16));
  const b = channel(parseInt(value.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(fullPath);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [fullPath] : [];
  });
}

describe("theme contrast", () => {
  it("keeps storefront text and controls readable across category themes", () => {
    for (const theme of listThemes()) {
      expect(contrast(theme.text, theme.bg), `${theme.id} text/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.text, theme.cardBg), `${theme.id} text/card`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.accentText, theme.accent), `${theme.id} accentText/accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.accent, theme.cardBg), `${theme.id} accent/card`).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.accent, theme.bg), `${theme.id} accent/bg`).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.accent, theme.bgAlt), `${theme.id} accent/bgAlt`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("dark-mode color discipline", () => {
  it("does not use light-only status utility colors in app components", () => {
    const roots = ["app", "components"].flatMap((dir) => filesUnder(path.join(process.cwd(), dir)));
    const forbidden = /\b(?:bg|text|border|hover:bg)-(?:red|yellow|blue)-(?:50|100|200|300|400|500|600|700|800|900)\b/;
    const failures = roots
      .map((file) => {
        const content = fs.readFileSync(file, "utf8");
        return forbidden.test(content) ? path.relative(process.cwd(), file) : null;
      })
      .filter(Boolean);

    expect(failures).toEqual([]);
  });
});

