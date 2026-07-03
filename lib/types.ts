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
}

export interface StorefrontData {
  shopName: string;
  tagline: string;
  category: string;
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
