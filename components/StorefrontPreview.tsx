"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { StorefrontData, Product, BusinessPhoto, BusinessProfile } from "@/lib/types";
import { newProductId, scriptLangFor } from "@/lib/types";
import {
  formattedAddress,
  hoursSummary,
  parseGoogleMapsCoordinates,
  photosByType,
  withBusinessProfile,
} from "@/lib/businessProfile";
import { themeForSite } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { resolveFontStack } from "@/lib/fonts";
import EditableText from "./EditableText";

interface StorefrontPreviewProps {
  data: StorefrontData;
  onChange: (data: StorefrontData) => void;
}

export default function StorefrontPreview({ data, onChange }: StorefrontPreviewProps) {
  const normalized = withBusinessProfile(data);
  const profile = normalized.businessProfile!;
  const theme = themeForSite(data);
  const displayFont = resolveFontStack(theme.fontDisplayName, "display");
  const bodyFont = resolveFontStack(theme.fontBodyName, "body");

  const update = <K extends keyof StorefrontData>(key: K, value: StorefrontData[K]) => {
    onChange(withBusinessProfile({ ...data, [key]: value }));
  };

  const updateProfile = (nextProfile: BusinessProfile) => {
    onChange(withBusinessProfile({ ...data, businessProfile: nextProfile }));
  };

  const updateProduct = (index: number, patch: Partial<Product>) => {
    const products = data.products.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange(withBusinessProfile({ ...data, products }));
  };

  const removeProduct = (index: number) => {
    onChange(withBusinessProfile({ ...data, products: data.products.filter((_, i) => i !== index) }));
  };

  const addProduct = () => {
    onChange(withBusinessProfile({
      ...data,
      products: [
        ...data.products,
        { id: newProductId(), name: "New item", description: "Describe it here", price: null, stock: null, sku: null },
      ],
    }));
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
          value={profile.contact.businessName}
          onChange={(v) => updateProfile({ ...profile, contact: { ...profile.contact, businessName: v } })}
          as="h1"
          className="text-4xl font-semibold sm:text-5xl"
          style={{ fontFamily: displayFont }}
          placeholder="Your Shop Name"
        />
        <EditableText
          value={normalized.tagline}
          onChange={(v) => update("tagline", v)}
          as="p"
          className="mx-auto mt-3 max-w-lg text-lg"
          style={{ fontFamily: displayFont, fontStyle: theme.displayItalicAccent ? "italic" : "normal" }}
          placeholder="Your one-line tagline"
        />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {profile.contact.whatsapp && (
            <span
              className="rounded-xl px-6 py-3 text-sm font-semibold shadow-sm"
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
            >
              Message on WhatsApp
            </span>
          )}
          {profile.contact.phone && (
            <span
              className="rounded-xl border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: theme.border }}
            >
              Call {profile.contact.phone}
            </span>
          )}
        </div>
      </header>

      <BusinessProfileEditor
        profile={profile}
        theme={theme}
        displayFont={displayFont}
        onChange={updateProfile}
      />

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
          value={hoursSummary(profile.hours, data.hours)}
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
                overlayBg={theme.text}
                overlayText={theme.bg}
                errorColor={theme.accentDeep}
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
            <ContactRow icon="📍" value={formattedAddress(profile.address, data.address)} onChange={(v) => update("address", v || null)} placeholder="Add address" />
            <ContactRow icon="📞" value={profile.contact.phone} onChange={(v) => updateProfile({ ...profile, contact: { ...profile.contact, phone: v || null } })} placeholder="Add phone number" />
            <ContactRow icon="💬" value={profile.contact.whatsapp} onChange={(v) => updateProfile({ ...profile, contact: { ...profile.contact, whatsapp: v || null } })} placeholder="Add WhatsApp number" />
            <ContactRow icon="✉️" value={profile.contact.email} onChange={(v) => updateProfile({ ...profile, contact: { ...profile.contact, email: v || null } })} placeholder="Add email" />
          </div>
          <div
            className="flex min-h-[180px] flex-1 min-w-[240px] items-center justify-center rounded-2xl border border-dashed text-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.bgAlt, color: theme.textMuted }}
          >
            {formattedAddress(profile.address, data.address) ? `Map: ${formattedAddress(profile.address, data.address)}` : "Map preview"}
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
  overlayBg,
  overlayText,
  errorColor,
  onChange,
}: {
  image: string | null;
  borderColor: string;
  overlayBg: string;
  overlayText: string;
  errorColor: string;
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
              className="min-h-[40px] rounded-lg px-3 py-2 text-xs font-semibold opacity-90 backdrop-blur-sm"
              style={{ backgroundColor: overlayBg, color: overlayText }}
            >
              {uploading ? "Uploading..." : "Change"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold opacity-90 backdrop-blur-sm"
              style={{ backgroundColor: overlayBg, color: overlayText }}
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
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: errorColor }}>
          {error}
        </p>
      )}
    </div>
  );
}

function BusinessProfileEditor({
  profile,
  theme,
  displayFont,
  onChange,
}: {
  profile: BusinessProfile;
  theme: Theme;
  displayFont: string;
  onChange: (profile: BusinessProfile) => void;
}) {
  const [mapsUrl, setMapsUrl] = useState("");
  const gallery = photosByType(profile, "gallery");
  const updateContact = (key: keyof BusinessProfile["contact"], value: string | null) => {
    onChange({ ...profile, contact: { ...profile.contact, [key]: value } });
  };
  const updateAddress = (key: keyof BusinessProfile["address"], value: string | null) => {
    onChange({ ...profile, address: { ...profile.address, [key]: value } });
  };
  const updateLocation = (patch: Partial<BusinessProfile["location"]>) => {
    onChange({ ...profile, location: { ...profile.location, ...patch } });
  };
  const addPhoto = (photo: BusinessPhoto) => {
    const nextPhoto = {
      ...photo,
      sortOrder: profile.photos.filter((p) => p.type === photo.type).length,
      altText: photo.altText || profile.contact.businessName,
    };
    onChange({ ...profile, photos: [...profile.photos, nextPhoto] });
  };
  const removePhoto = (id: string) => {
    onChange({ ...profile, photos: profile.photos.filter((photo) => photo.id !== id) });
  };
  const updatePhoto = (id: string, patch: Partial<BusinessPhoto>) => {
    onChange({
      ...profile,
      photos: profile.photos.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)),
    });
  };
  const moveGallery = (id: string, delta: -1 | 1) => {
    const ordered = gallery.slice();
    const index = ordered.findIndex((photo) => photo.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const [item] = ordered.splice(index, 1);
    ordered.splice(target, 0, item);
    const sortById = new Map(ordered.map((photo, i) => [photo.id, i]));
    onChange({
      ...profile,
      photos: profile.photos.map((photo) =>
        sortById.has(photo.id) ? { ...photo, sortOrder: sortById.get(photo.id)! } : photo
      ),
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      updateLocation({
        latitude: Number(pos.coords.latitude.toFixed(7)),
        longitude: Number(pos.coords.longitude.toFixed(7)),
        accuracy: Math.round(pos.coords.accuracy),
        source: "gps",
      });
    });
  };

  return (
    <section className="px-5 py-10 sm:px-16" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <h2 className="mb-4 text-2xl font-semibold" style={{ fontFamily: displayFont }}>
        Business Profile
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfilePhotoSlot
          label="Logo"
          type="logo"
          photos={photosByType(profile, "logo")}
          borderColor={theme.border}
          textColor={theme.textMuted}
          onAdd={addPhoto}
          onRemove={removePhoto}
          onAltChange={updatePhoto}
        />
        <ProfilePhotoSlot
          label="Cover image"
          type="cover"
          photos={photosByType(profile, "cover")}
          borderColor={theme.border}
          textColor={theme.textMuted}
          onAdd={addPhoto}
          onRemove={removePhoto}
          onAltChange={updatePhoto}
        />
      </div>

      <div className="mt-4 rounded-xl border p-4" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Gallery</h3>
          <ProfileUploadButton type="gallery" label="Add images" onUploaded={addPhoto} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {gallery.map((photo, index) => (
            <div key={photo.id} className="rounded-lg border p-2" style={{ borderColor: theme.border }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumbnailPath || photo.path} alt={photo.altText} className="h-28 w-full rounded-md object-cover" />
              <input
                value={photo.altText}
                onChange={(e) => updatePhoto(photo.id, { altText: e.target.value })}
                className="mt-2 w-full rounded-md border px-2 py-1 text-xs"
                style={{ borderColor: theme.border, color: theme.text }}
                placeholder="Alt text"
              />
              <div className="mt-2 flex gap-1">
                <button type="button" onClick={() => moveGallery(photo.id, -1)} disabled={index === 0} className="min-h-[36px] flex-1 rounded-md border text-xs disabled:opacity-40" style={{ borderColor: theme.border }}>Up</button>
                <button type="button" onClick={() => moveGallery(photo.id, 1)} disabled={index === gallery.length - 1} className="min-h-[36px] flex-1 rounded-md border text-xs disabled:opacity-40" style={{ borderColor: theme.border }}>Down</button>
                <button type="button" onClick={() => removePhoto(photo.id)} className="min-h-[36px] flex-1 rounded-md border text-xs" style={{ borderColor: theme.border }}>Delete</button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && <p className="text-sm" style={{ color: theme.textMuted }}>No gallery images yet.</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FieldGroup title="Contact" theme={theme}>
          <ProfileInput label="Business name" value={profile.contact.businessName} onChange={(v) => updateContact("businessName", v || "")} />
          <ProfileInput label="Owner name" value={profile.contact.ownerName} onChange={(v) => updateContact("ownerName", v)} />
          <ProfileInput label="Phone" value={profile.contact.phone} onChange={(v) => updateContact("phone", v)} />
          <ProfileInput label="WhatsApp" value={profile.contact.whatsapp} onChange={(v) => updateContact("whatsapp", v)} />
          <ProfileInput label="Email" value={profile.contact.email} onChange={(v) => updateContact("email", v)} />
          <ProfileInput label="Website" value={profile.contact.website} onChange={(v) => updateContact("website", v)} />
          <ProfileInput label="Alternate phone" value={profile.contact.alternatePhone} onChange={(v) => updateContact("alternatePhone", v)} />
          <ProfileInput label="Support email" value={profile.contact.supportEmail} onChange={(v) => updateContact("supportEmail", v)} />
        </FieldGroup>

        <FieldGroup title="Address" theme={theme}>
          {(["shopNumber", "building", "street", "landmark", "area", "city", "district", "state", "country", "postalCode"] as const).map((key) => (
            <ProfileInput key={key} label={key.replace(/([A-Z])/g, " $1")} value={profile.address[key]} onChange={(v) => updateAddress(key, v)} />
          ))}
        </FieldGroup>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FieldGroup title="Location" theme={theme}>
          <ProfileInput label="Latitude" value={profile.location.latitude == null ? null : String(profile.location.latitude)} onChange={(v) => updateLocation({ latitude: v ? Number(v) : null, source: "manual" })} />
          <ProfileInput label="Longitude" value={profile.location.longitude == null ? null : String(profile.location.longitude)} onChange={(v) => updateLocation({ longitude: v ? Number(v) : null, source: "manual" })} />
          <ProfileInput label="Google Maps URL" value={mapsUrl} onChange={(v) => {
            setMapsUrl(v ?? "");
            const parsed = v ? parseGoogleMapsCoordinates(v) : null;
            if (parsed) updateLocation({ ...parsed, source: "maps-url" });
          }} />
          <div className="flex gap-2">
            <button type="button" onClick={useCurrentLocation} className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm font-medium" style={{ borderColor: theme.border }}>
              Use Current Location
            </button>
            <button type="button" onClick={() => updateLocation({ mapProvider: profile.location.mapProvider === "google" ? "osm" : "google" })} className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm font-medium" style={{ borderColor: theme.border }}>
              {profile.location.mapProvider === "google" ? "Google Maps" : "OpenStreetMap"}
            </button>
          </div>
        </FieldGroup>

        <FieldGroup title="Business Hours" theme={theme}>
          <ProfileInput label="Temporary closure" value={profile.hours.temporaryClosure} onChange={(v) => onChange({ ...profile, hours: { ...profile.hours, temporaryClosure: v } })} />
          <div className="space-y-2">
            {profile.hours.weekly.map((slot, i) => (
              <div key={slot.day} className="grid grid-cols-[1fr_72px_72px_70px] items-center gap-2 text-xs">
                <span>{slot.day}</span>
                <input value={slot.open} disabled={slot.closed} onChange={(e) => {
                  const weekly = profile.hours.weekly.slice();
                  weekly[i] = { ...slot, open: e.target.value };
                  onChange({ ...profile, hours: { ...profile.hours, weekly } });
                }} className="rounded-md border px-2 py-1 disabled:opacity-40" style={{ borderColor: theme.border }} />
                <input value={slot.close} disabled={slot.closed} onChange={(e) => {
                  const weekly = profile.hours.weekly.slice();
                  weekly[i] = { ...slot, close: e.target.value };
                  onChange({ ...profile, hours: { ...profile.hours, weekly } });
                }} className="rounded-md border px-2 py-1 disabled:opacity-40" style={{ borderColor: theme.border }} />
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={slot.closed} onChange={(e) => {
                    const weekly = profile.hours.weekly.slice();
                    weekly[i] = { ...slot, closed: e.target.checked };
                    onChange({ ...profile, hours: { ...profile.hours, weekly } });
                  }} />
                  Closed
                </label>
              </div>
            ))}
          </div>
        </FieldGroup>
      </div>
    </section>
  );
}

function FieldGroup({ title, theme, children }: { title: string; theme: Theme; children: ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ProfileInput({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block capitalize opacity-70">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="min-h-[38px] w-full rounded-md border border-black/15 bg-white/70 px-2 py-1 text-sm text-black"
      />
    </label>
  );
}

function ProfilePhotoSlot({
  label,
  type,
  photos,
  borderColor,
  textColor,
  onAdd,
  onRemove,
  onAltChange,
}: {
  label: string;
  type: BusinessPhoto["type"];
  photos: BusinessPhoto[];
  borderColor: string;
  textColor: string;
  onAdd: (photo: BusinessPhoto) => void;
  onRemove: (id: string) => void;
  onAltChange: (id: string, patch: Partial<BusinessPhoto>) => void;
}) {
  const photo = photos[0];
  return (
    <div className="rounded-xl border p-4" style={{ borderColor }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <ProfileUploadButton type={type} label={photo ? "Replace" : "Upload"} onUploaded={(next) => {
          if (photo) onRemove(photo.id);
          onAdd({ ...next, type, sortOrder: 0 });
        }} />
      </div>
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.thumbnailPath || photo.path} alt={photo.altText} className="h-32 w-full rounded-lg object-cover" />
          <input value={photo.altText} onChange={(e) => onAltChange(photo.id, { altText: e.target.value })} className="mt-2 w-full rounded-md border px-2 py-1 text-xs text-black" placeholder="Alt text" />
          <button type="button" onClick={() => onRemove(photo.id)} className="mt-2 min-h-[36px] w-full rounded-md border text-xs" style={{ borderColor }}>Delete</button>
        </>
      ) : (
        <p className="text-sm" style={{ color: textColor }}>No {label.toLowerCase()} selected.</p>
      )}
    </div>
  );
}

function ProfileUploadButton({ type, label, onUploaded }: { type: BusinessPhoto["type"]; label: string; onUploaded: (photo: BusinessPhoto) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      form.append("altText", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      onUploaded(json.photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        multiple={type === "gallery"}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          void Promise.all(files.map(upload));
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="min-h-[36px] rounded-md border border-black/15 px-3 text-xs font-medium disabled:opacity-50">
        {busy ? "Uploading..." : label}
      </button>
      {error && <span className="ml-2 text-xs" style={{ color: "#9F2F1F" }}>{error}</span>}
    </span>
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
