export type Language = "en" | "hi" | "hinglish";

/** Longest business description we send to the AI — enforced in the capture
 * UI (live counter) and again in /api/generate. Keeps a single tap from
 * becoming an unbounded token bill. */
export const MAX_DESCRIPTION_LENGTH = 2000;

/** Hard cap on sites (drafts + published) per account — an abuse valve, far
 * above anything a real shop owner needs. */
export const MAX_SITES_PER_USER = 25;

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  hinglish: "Hinglish",
};

/** The script/lang the generated copy is written in - drives the <html lang>
 * attribute and font fallback order. Hindi is Devanagari script; English and
 * Hinglish are both written in Latin script. */
export function scriptLangFor(language: Language): "hi" | "en" {
  return language === "hi" ? "hi" : "en";
}

export interface Product {
  /** Client-generated stable key for editor list rendering. Optional —
   * AI/sample output has no ids; the editor falls back to index keys. */
  id?: string;
  name: string;
  description: string;
  price: string | null;
   /** Path to an uploaded photo (e.g. "/uploads/abc.jpg"), or absent/null.
    * Cards without a photo render as pure text cards — never a broken image
    * or an empty placeholder box. */
  image?: string | null;
  /** Stock quantity for inventory tracking. null = not tracked. */
  stock?: number | null;
  /** SKU (Stock Keeping Unit) for inventory management. Optional. */
  sku?: string | null;
}

export interface StorefrontData {
  shopName: string;
  tagline: string;
  category: string;
  /** Theme id the owner picked in the theme switcher. When set, it wins over
   * the AI/keyword category match everywhere (editor preview and the
   * published site). Absent/null = "let the category decide". */
  themeOverride?: string | null;
  aboutText: string;
  hours: string;
  products: Product[];
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  language: Language;
}

/** Stable list key for editor rendering. randomUUID needs a secure context,
 * so fall back to a plain random token (http over LAN, old WebViews). */
export function newProductId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

/** AI/sample/legacy-saved products carry no ids — assign them once, when data
 * enters the editor, so React keys stay stable across edits and removals. */
export function ensureProductIds(data: StorefrontData): StorefrontData {
  if (data.products.every((p) => p.id)) return data;
  return {
    ...data,
    products: data.products.map((p) => (p.id ? p : { ...p, id: newProductId() })),
  };
}

const MAX_TEXT = 2000;
const MAX_SHORT_TEXT = 200;
const MAX_PRODUCTS = 40;
const UPLOAD_PATH_RE = /^\/uploads\/[0-9]+-[a-f0-9]+\.(jpg|png|webp)$/;
const VALID_LANGUAGES = new Set<Language>(["en", "hi", "hinglish"]);

function isString(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === "string" && value.length <= max;
}

function isNullableString(value: unknown, max = MAX_TEXT): value is string | null {
  return value === null || isString(value, max);
}

function isValidImage(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || (typeof value === "string" && UPLOAD_PATH_RE.test(value));
}

/** Strict shape check before trusting client-sent site data. */
export function validStorefront(data: unknown): data is StorefrontData {
  if (!data || typeof data !== "object") return false;
  const d = data as StorefrontData;
  return (
    isString(d.shopName, MAX_SHORT_TEXT) &&
    d.shopName.trim().length > 0 &&
    isString(d.tagline, MAX_SHORT_TEXT) &&
    isString(d.category, MAX_SHORT_TEXT) &&
    isString(d.aboutText) &&
    isString(d.hours, MAX_SHORT_TEXT) &&
    isNullableString(d.address) &&
    isNullableString(d.phone, MAX_SHORT_TEXT) &&
    isNullableString(d.whatsapp, MAX_SHORT_TEXT) &&
    isNullableString(d.email, MAX_SHORT_TEXT) &&
    VALID_LANGUAGES.has(d.language) &&
    (d.themeOverride === undefined || d.themeOverride === null || isString(d.themeOverride, MAX_SHORT_TEXT)) &&
    Array.isArray(d.products) &&
    d.products.length <= MAX_PRODUCTS &&
    d.products.every(
      (p) =>
        p &&
        typeof p === "object" &&
        ((p as Product).id === undefined || isString((p as Product).id, 64)) &&
        isString((p as Product).name, MAX_SHORT_TEXT) &&
        (p as Product).name.trim().length > 0 &&
        isString((p as Product).description) &&
        isNullableString((p as Product).price, MAX_SHORT_TEXT) &&
        isValidImage((p as Product).image) &&
        ((p as Product).stock === undefined || (p as Product).stock === null || typeof (p as Product).stock === "number") &&
        ((p as Product).sku === undefined || (p as Product).sku === null || isString((p as Product).sku, 100))
    )
  );
}

export const EMPTY_STOREFRONT: StorefrontData = {
  shopName: "",
  tagline: "",
  category: "general",
  aboutText: "",
  hours: "",
  products: [],
  address: null,
  phone: null,
  whatsapp: null,
  email: null,
  language: "hinglish",
};
