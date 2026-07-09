"use client";

import { useRef, useState } from "react";
import type { StorefrontData, Product } from "@/lib/types";
import { newProductId, scriptLangFor } from "@/lib/types";
import { themeForSite } from "@/lib/theme";
import { resolveFontStack } from "@/lib/fonts";
import EditableText from "./EditableText";

interface StorefrontPreviewProps {
  data: StorefrontData;
  onChange: (data: StorefrontData) => void;
}

export default function StorefrontPreview({ data, onChange }: StorefrontPreviewProps) {
  const theme = themeForSite(data);
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
      products: [
        ...data.products,
        { id: newProductId(), name: "New item", description: "Describe it here", price: null, stock: null, sku: null },
      ],
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
        className="px-5 py-12 text-center sm:px-16 sm:py-16"
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
      <section className="px-5 py-10 sm:px-16">
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
        className="px-5 py-10 sm:px-16"
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
      <section className="px-5 py-10 sm:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: displayFont }}>
            What We Offer
          </h2>
          <button
            type="button"
            onClick={addProduct}
            className="min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ borderColor: theme.border }}
          >
            + Add item
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.products.map((product, i) => (
            <div
              key={product.id ?? i}
              className="relative rounded-2xl border p-5 transition-shadow hover:shadow-md"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => removeProduct(i)}
                aria-label="Remove item"
                className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-sm opacity-50 hover:opacity-100"
              >
                &#10005;
              </button>
              <ProductPhoto
                image={product.image ?? null}
                borderColor={theme.border}
                onChange={(url) => updateProduct(i, { image: url })}
              />
              {!product.image && (
                <p className="mb-1 text-xs italic" style={{ color: theme.textMuted }}>
                  Tip: Upload a photo or describe your product for AI image generation (coming soon)
                </p>
              )}
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
              <div className="mt-2 flex gap-2">
                <EditableText
                  value={product.sku ?? ""}
                  onChange={(v) => updateProduct(i, { sku: v || null })}
                  as="span"
                  className="text-xs"
                  style={{ color: theme.textMuted }}
                  placeholder="SKU (optional)"
                />
                <EditableText
                  value={product.stock != null ? String(product.stock) : ""}
                  onChange={(v) => updateProduct(i, { stock: v ? parseInt(v, 10) || null : null })}
                  as="span"
                  className="text-xs"
                  style={{ color: theme.textMuted }}
                  placeholder="Stock qty"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section
        className="px-5 py-10 sm:px-16"
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

      {/* FAQ */}
      <section className="px-5 py-10 sm:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: displayFont }}>
            FAQs
          </h2>
          <button
            type="button"
            onClick={() => {
              const faq = data.faq ? [...data.faq] : [];
              faq.push({ question: "New question?", answer: "Answer here" });
              update("faq", faq);
            }}
            className="min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ borderColor: theme.border }}
          >
            + Add FAQ
          </button>
        </div>
        {data.faq && data.faq.length > 0 ? (
          <div className="space-y-3">
            {data.faq.map((f, i) => (
              <div
                key={i}
                className="relative rounded-xl border p-4"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const faq = data.faq!.filter((_, j) => j !== i);
                    update("faq", faq.length > 0 ? faq : undefined);
                  }}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-sm opacity-50 hover:opacity-100"
                >
                  &#10005;
                </button>
                <EditableText
                  value={f.question}
                  onChange={(v) => {
                    const faq = [...data.faq!];
                    faq[i] = { ...faq[i], question: v };
                    update("faq", faq);
                  }}
                  as="summary"
                  className="pr-6 text-sm font-semibold"
                  placeholder="Question"
                />
                <EditableText
                  value={f.answer}
                  onChange={(v) => {
                    const faq = [...data.faq!];
                    faq[i] = { ...faq[i], answer: v };
                    update("faq", faq);
                  }}
                  as="p"
                  className="mt-1 text-sm"
                  style={{ color: theme.textMuted }}
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: theme.textMuted }}>
            No FAQs yet. Add some to help customers find answers quickly.
          </p>
        )}
      </section>

      <footer className="px-8 py-6 text-center text-xs" style={{ color: theme.textMuted }}>
        Built with ApnaSite AI
      </footer>
    </div>
  );
}

/** Photo slot on a product card in the editor. Uploads to /api/upload and
 * stores the returned URL on the product. A card with no photo shows only a
 * quiet "Add photo" button — the published site renders such cards as clean
 * text-only cards. */
function ProductPhoto({
  image,
  borderColor,
  onChange,
}: {
  image: string | null;
  borderColor: string;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {image ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="h-40 w-full rounded-xl border object-cover"
            style={{ borderColor }}
          />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="min-h-[40px] rounded-lg bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
            >
              {uploading ? "Uploading..." : "Change"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/55 text-xs font-semibold text-white backdrop-blur-sm"
            >
              &#10005;
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-medium opacity-60 transition-opacity hover:opacity-100 disabled:opacity-40"
          style={{ borderColor }}
        >
          <span aria-hidden>&#128247;</span> {uploading ? "Uploading..." : "Add photo"}
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
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
