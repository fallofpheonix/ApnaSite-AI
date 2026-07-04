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

/** Minimal shape check before trusting client-sent site data. */
export function validStorefront(data: unknown): data is StorefrontData {
  if (!data || typeof data !== "object") return false;
  const d = data as StorefrontData;
  return (
    typeof d.shopName === "string" && d.shopName.trim().length > 0 && Array.isArray(d.products)
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
