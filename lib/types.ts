export type Language = "en" | "hi" | "hinglish";

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
  name: string;
  description: string;
  price: string | null;
  /** Path to an uploaded photo (e.g. "/uploads/abc.jpg"), or absent/null.
   * Cards without a photo render as pure text cards — never a broken image
   * or an empty placeholder box. */
  image?: string | null;
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
        isString((p as Product).name, MAX_SHORT_TEXT) &&
        (p as Product).name.trim().length > 0 &&
        isString((p as Product).description) &&
        isNullableString((p as Product).price, MAX_SHORT_TEXT) &&
        isValidImage((p as Product).image)
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
