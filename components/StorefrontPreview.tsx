"use client";

import type { StorefrontData, Product } from "@/lib/types";
import { scriptLangFor } from "@/lib/types";
import { resolveTheme } from "@/lib/theme";
import { resolveFontStack } from "@/lib/fonts";
import EditableText from "./EditableText";

interface StorefrontPreviewProps {
  data: StorefrontData;
  onChange: (data: StorefrontData) => void;
}

export default function StorefrontPreview({ data, onChange }: StorefrontPreviewProps) {
  const theme = resolveTheme(data.category);
  const displayFont = resolveFontStack(theme.fontDisplayName, "display");
  const bodyFont = resolveFontStack(theme.fontBodyName, "body");

  const update = <K extends keyof StorefrontData>(key: K, value: StorefrontData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateProduct = (index: number, patch: Partial<Product>) => {
    const products = data.products.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ ...data, products });
  };

  const removeProduct = (index: number) => {
    onChange({ ...data, products: data.products.filter((_, i) => i !== index) });
  };

  const addProduct = () => {
    onChange({
      ...data,
      products: [...data.products, { name: "New item", description: "Describe it here", price: null }],
    });
  };

  return (
    <div
      lang={scriptLangFor(data.language)}
      className="w-full overflow-hidden rounded-3xl border shadow-xl"
      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: bodyFont }}
    >
      {/* Hero */}
      <header
        className="px-8 py-16 text-center sm:px-16"
        style={{ backgroundColor: theme.bgAlt, borderBottom: `1px solid ${theme.border}` }}
      >
        <EditableText
          value={data.category}
          onChange={(v) => update("category", v)}
          as="span"
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: theme.accent, color: theme.accentText }}
          placeholder="category"
        />
        <EditableText
          value={data.shopName}
          onChange={(v) => update("shopName", v)}
          as="h1"
          className="text-4xl font-semibold sm:text-5xl"
          style={{ fontFamily: displayFont }}
          placeholder="Your Shop Name"
        />
        <EditableText
          value={data.tagline}
          onChange={(v) => update("tagline", v)}
          as="p"
          className="mx-auto mt-3 max-w-lg text-lg"
          style={{ fontFamily: displayFont, fontStyle: theme.displayItalicAccent ? "italic" : "normal" }}
          placeholder="Your one-line tagline"
        />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {data.whatsapp && (
            <span
              className="rounded-xl px-6 py-3 text-sm font-semibold shadow-sm"
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
            >
              Message on WhatsApp
            </span>
          )}
          {data.phone && (
            <span
              className="rounded-xl border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: theme.border }}
            >
              Call {data.phone}
            </span>
          )}
        </div>
      </header>

      {/* About */}
      <section className="px-8 py-10 sm:px-16">
        <h2 className="mb-3 text-2xl font-semibold" style={{ fontFamily: displayFont }}>
          About Us
        </h2>
        <EditableText
          value={data.aboutText}
          onChange={(v) => update("aboutText", v)}
          as="p"
          className="max-w-2xl text-base leading-relaxed"
          placeholder="Tell customers about your business..."
        />
      </section>

      {/* Hours */}
      <section
        className="px-8 py-10 sm:px-16"
        style={{ backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}
      >
        <h2 className="mb-3 text-2xl font-semibold" style={{ fontFamily: displayFont }}>
          Hours
        </h2>
        <EditableText
          value={data.hours}
          onChange={(v) => update("hours", v)}
          as="div"
          className="inline-block rounded-xl border px-5 py-3"
          placeholder="e.g. 8 AM - 6 PM, Tue - Sun"
        />
      </section>

      {/* Products */}
      <section className="px-8 py-10 sm:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: displayFont }}>
            What We Offer
          </h2>
          <button
            type="button"
            onClick={addProduct}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ borderColor: theme.border }}
          >
            + Add item
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.products.map((product, i) => (
            <div
              key={i}
              className="relative rounded-2xl border p-5 transition-shadow hover:shadow-md"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => removeProduct(i)}
                aria-label="Remove item"
                className="absolute right-3 top-3 text-sm opacity-50 hover:opacity-100"
              >
                &#10005;
              </button>
              <EditableText
                value={product.name}
                onChange={(v) => updateProduct(i, { name: v })}
                as="h3"
                className="pr-6 text-lg font-semibold"
                style={{ fontFamily: displayFont }}
                placeholder="Item name"
              />
              <EditableText
                value={product.description}
                onChange={(v) => updateProduct(i, { description: v })}
                as="p"
                className="mt-1 text-sm"
                style={{ color: theme.textMuted }}
                placeholder="Item description"
              />
              <EditableText
                value={product.price ?? ""}
                onChange={(v) => updateProduct(i, { price: v || null })}
                as="span"
                className="mt-2 inline-block text-sm font-bold"
                style={{ color: theme.accent }}
                placeholder="Price (optional)"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section
        className="px-8 py-10 sm:px-16"
        style={{ backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.border}` }}
      >
        <h2 className="mb-4 text-2xl font-semibold" style={{ fontFamily: displayFont }}>
          Visit / Contact Us
        </h2>
        <div className="flex flex-wrap items-start gap-8">
          <div className="min-w-[220px] space-y-2 text-sm" style={{ color: theme.textMuted }}>
            <ContactRow icon="📍" value={data.address} onChange={(v) => update("address", v || null)} placeholder="Add address" />
            <ContactRow icon="📞" value={data.phone} onChange={(v) => update("phone", v || null)} placeholder="Add phone number" />
            <ContactRow icon="💬" value={data.whatsapp} onChange={(v) => update("whatsapp", v || null)} placeholder="Add WhatsApp number" />
            <ContactRow icon="✉️" value={data.email} onChange={(v) => update("email", v || null)} placeholder="Add email" />
          </div>
          <div
            className="flex min-h-[180px] flex-1 min-w-[240px] items-center justify-center rounded-2xl border border-dashed text-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.bgAlt, color: theme.textMuted }}
          >
            {data.address ? `Map: ${data.address}` : "Map preview"}
          </div>
        </div>
      </section>

      <footer className="px-8 py-6 text-center text-xs" style={{ color: theme.textMuted }}>
        Built with VoxSite AI
      </footer>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: string;
  value: string | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <EditableText value={value ?? ""} onChange={onChange} as="span" placeholder={placeholder} />
    </div>
  );
}
