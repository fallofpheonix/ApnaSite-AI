"use client";

import type { StorefrontData } from "@/lib/types";
import { resolveTheme, themeForSite, listThemes, type Theme } from "@/lib/theme";
import { resolveFontStack } from "@/lib/fonts";

// Alternates shown after the AI-matched theme: a curated spread of the most
// visually distinct looks (two dark, three light, different type moods) so
// the strip demonstrates range without listing all 15 themes.
const FEATURED_ALTERNATE_IDS = ["general", "sweets", "jewellery", "gym", "electronics", "bakery"];
const MAX_ALTERNATES = 5;

interface ThemeSwitcherProps {
  data: StorefrontData;
  onChange: (data: StorefrontData) => void;
}

export default function ThemeSwitcher({ data, onChange }: ThemeSwitcherProps) {
  const matched = resolveTheme(data.category); // what the AI/category picked
  const active = themeForSite(data);

  const all = listThemes();
  const alternates = FEATURED_ALTERNATE_IDS.map((id) => all.find((t) => t.id === id))
    .filter((t): t is Theme => Boolean(t) && t!.id !== matched.id)
    .slice(0, MAX_ALTERNATES);

  // Tapping the matched theme clears the override (back to "AI's choice"),
  // tapping an alternate pins it.
  const select = (theme: Theme) => {
    onChange({ ...data, themeOverride: theme.id === matched.id ? null : theme.id });
  };

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Look &amp; feel — tap to try
      </p>
      {/* Horizontal strip; scrolls on phones. The last swatch peeks past the
          edge (scroll-fade in globals.css) so it's visibly scrollable. */}
      <div className="scroll-fade -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-1">
        {[matched, ...alternates].map((theme, i) => (
          <ThemeSwatch
            key={theme.id}
            theme={theme}
            label={i === 0 ? `${theme.label} · AI pick` : theme.label}
            wide={i === 0} // room for the "· AI pick" suffix
            selected={active.id === theme.id}
            onSelect={() => select(theme)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeSwatch({
  theme,
  label,
  wide = false,
  selected,
  onSelect,
}: {
  theme: Theme;
  label: string;
  wide?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-[76px] ${wide ? "w-44" : "w-32"} shrink-0 flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-shadow ${
        selected ? "border-teal shadow-md" : "border-ink/10 hover:shadow-sm"
      }`}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <span
        className="text-xl leading-none"
        style={{ fontFamily: resolveFontStack(theme.fontDisplayName, "display") }}
      >
        Aa
      </span>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span className="flex gap-1">
          <Dot color={theme.accent} borderColor={theme.border} />
          <Dot color={theme.cardBg} borderColor={theme.border} />
          <Dot color={theme.bgAlt} borderColor={theme.border} />
        </span>
        <span className="truncate text-[10px] font-medium opacity-80">{label}</span>
      </span>
    </button>
  );
}

function Dot({ color, borderColor }: { color: string; borderColor: string }) {
  return (
    <span
      aria-hidden
      className="h-3 w-3 rounded-full border"
      style={{ backgroundColor: color, borderColor }}
    />
  );
}
