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

export type BusinessPhotoType = "logo" | "cover" | "gallery" | "product" | "team";
export type MapProvider = "google" | "osm";

export interface BusinessPhoto {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string;
  altText: string;
  uploadedBy: string;
  uploadedAt: string;
  type: BusinessPhotoType;
  sortOrder: number;
}

export interface BusinessContact {
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  alternatePhone: string | null;
  supportEmail: string | null;
}

export interface BusinessAddress {
  shopNumber: string | null;
  building: string | null;
  street: string | null;
  landmark: string | null;
  area: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

export interface BusinessLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  source: "manual" | "gps" | "maps-url" | "address-search" | null;
  mapProvider: MapProvider;
}

export interface DayHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  weekly: DayHours[];
  specialHours: Array<{ date: string; open: string | null; close: string | null; closed: boolean; note: string | null }>;
  temporaryClosure: string | null;
}

export interface BusinessProfile {
  photos: BusinessPhoto[];
  contact: BusinessContact;
  address: BusinessAddress;
  location: BusinessLocation;
  hours: BusinessHours;
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
  /** Canonical business profile consumed by published channels. Legacy flat
   * contact fields remain mirrored for older generated/saved site data. */
  businessProfile?: BusinessProfile;
  language: Language;
  /** Frequently asked questions. Optional. */
  faq?: Array<{ question: string; answer: string }>;
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
const MAX_PHOTOS = 80;
const UPLOAD_PATH_RE = /^\/uploads\/(?:thumb-)?[0-9]+-[a-f0-9]+\.(jpg|png|webp)$/;
const VALID_LANGUAGES = new Set<Language>(["en", "hi", "hinglish"]);
const VALID_PHOTO_TYPES = new Set<BusinessPhotoType>(["logo", "cover", "gallery", "product", "team"]);
const VALID_MAP_PROVIDERS = new Set<MapProvider>(["google", "osm"]);

function isString(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === "string" && value.length <= max;
}

function isNullableString(value: unknown, max = MAX_TEXT): value is string | null {
  return value === null || isString(value, max);
}

function isValidImage(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || (typeof value === "string" && UPLOAD_PATH_RE.test(value));
}

function isValidPhone(value: unknown): value is string | null {
  if (value === null) return true;
  if (!isString(value, MAX_SHORT_TEXT)) return false;
  const digits = value.replace(/[^0-9]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function isValidEmail(value: unknown): value is string | null {
  if (value === null) return true;
  return isString(value, MAX_SHORT_TEXT) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidUrl(value: unknown): value is string | null {
  if (value === null) return true;
  if (!isString(value, MAX_SHORT_TEXT)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isNumberOrNull(value: unknown, min: number, max: number): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max);
}

function validBusinessProfile(value: unknown): value is BusinessProfile {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const profile = value as BusinessProfile;
  const contact = profile.contact;
  const address = profile.address;
  const location = profile.location;
  const hours = profile.hours;
  return (
    Array.isArray(profile.photos) &&
    profile.photos.length <= MAX_PHOTOS &&
    profile.photos.every((photo) =>
      photo &&
      typeof photo === "object" &&
      isString(photo.id, 80) &&
      isString(photo.filename, MAX_SHORT_TEXT) &&
      isValidImage(photo.path) &&
      isValidImage(photo.thumbnailPath) &&
      isString(photo.altText, MAX_SHORT_TEXT) &&
      isString(photo.uploadedBy, MAX_SHORT_TEXT) &&
      isString(photo.uploadedAt, MAX_SHORT_TEXT) &&
      VALID_PHOTO_TYPES.has(photo.type) &&
      typeof photo.sortOrder === "number" &&
      Number.isFinite(photo.sortOrder)
    ) &&
    contact &&
    typeof contact === "object" &&
    isString(contact.businessName, MAX_SHORT_TEXT) &&
    contact.businessName.trim().length > 0 &&
    isNullableString(contact.ownerName, MAX_SHORT_TEXT) &&
    isValidPhone(contact.phone) &&
    isValidPhone(contact.whatsapp) &&
    isValidEmail(contact.email) &&
    isValidUrl(contact.website) &&
    isValidPhone(contact.alternatePhone) &&
    isValidEmail(contact.supportEmail) &&
    address &&
    typeof address === "object" &&
    isNullableString(address.shopNumber, MAX_SHORT_TEXT) &&
    isNullableString(address.building, MAX_SHORT_TEXT) &&
    isNullableString(address.street, MAX_SHORT_TEXT) &&
    isNullableString(address.landmark, MAX_SHORT_TEXT) &&
    isNullableString(address.area, MAX_SHORT_TEXT) &&
    isNullableString(address.city, MAX_SHORT_TEXT) &&
    isNullableString(address.district, MAX_SHORT_TEXT) &&
    isNullableString(address.state, MAX_SHORT_TEXT) &&
    isNullableString(address.country, MAX_SHORT_TEXT) &&
    isNullableString(address.postalCode, MAX_SHORT_TEXT) &&
    location &&
    typeof location === "object" &&
    isNumberOrNull(location.latitude, -90, 90) &&
    isNumberOrNull(location.longitude, -180, 180) &&
    isNumberOrNull(location.accuracy, 0, 100000) &&
    (location.source === null || ["manual", "gps", "maps-url", "address-search"].includes(location.source)) &&
    VALID_MAP_PROVIDERS.has(location.mapProvider) &&
    hours &&
    typeof hours === "object" &&
    Array.isArray(hours.weekly) &&
    hours.weekly.length === 7 &&
    hours.weekly.every((slot) =>
      slot &&
      typeof slot === "object" &&
      isString(slot.day, 20) &&
      isString(slot.open, 20) &&
      isString(slot.close, 20) &&
      typeof slot.closed === "boolean"
    ) &&
    Array.isArray(hours.specialHours) &&
    hours.specialHours.length <= 40 &&
    hours.specialHours.every((slot) =>
      slot &&
      typeof slot === "object" &&
      isString(slot.date, 20) &&
      isNullableString(slot.open, 20) &&
      isNullableString(slot.close, 20) &&
      typeof slot.closed === "boolean" &&
      isNullableString(slot.note, MAX_SHORT_TEXT)
    ) &&
    isNullableString(hours.temporaryClosure, MAX_SHORT_TEXT)
  );
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
    isValidPhone(d.phone) &&
    isValidPhone(d.whatsapp) &&
    isValidEmail(d.email) &&
    validBusinessProfile(d.businessProfile) &&
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
    ) &&
    (d.faq === undefined || d.faq === null ||
      (Array.isArray(d.faq) && d.faq.length <= 20 &&
        d.faq.every((f) =>
          f && typeof f === "object" &&
          isString((f as { question: string }).question, MAX_SHORT_TEXT) &&
          isString((f as { answer: string }).answer)
        ))
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
