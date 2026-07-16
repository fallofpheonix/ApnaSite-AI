import type {
  BusinessAddress,
  BusinessContact,
  BusinessHours,
  BusinessLocation,
  BusinessPhoto,
  BusinessProfile,
  StorefrontData,
} from "./types";

export const BUSINESS_PHOTO_TYPES = ["logo", "cover", "gallery", "product", "team"] as const;
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function emptyContact(shopName = ""): BusinessContact {
  return {
    businessName: shopName,
    ownerName: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    alternatePhone: null,
    supportEmail: null,
  };
}

export function emptyAddress(): BusinessAddress {
  return {
    shopNumber: null,
    building: null,
    street: null,
    landmark: null,
    area: null,
    city: null,
    district: null,
    state: null,
    country: "India",
    postalCode: null,
  };
}

export function defaultBusinessHours(): BusinessHours {
  return {
    weekly: WEEKDAYS.map((day) => ({
      day,
      open: "09:00",
      close: "21:00",
      closed: day === "Sunday",
    })),
    specialHours: [],
    temporaryClosure: null,
  };
}

export function emptyLocation(): BusinessLocation {
  return {
    latitude: null,
    longitude: null,
    accuracy: null,
    source: null,
    mapProvider: "google",
  };
}

export function emptyBusinessProfile(shopName = ""): BusinessProfile {
  return {
    photos: [],
    contact: emptyContact(shopName),
    address: emptyAddress(),
    location: emptyLocation(),
    hours: defaultBusinessHours(),
  };
}

export function formattedAddress(address: BusinessAddress | null | undefined, fallback?: string | null): string | null {
  if (!address) return fallback?.trim() || null;
  const line1 = [address.shopNumber, address.building].filter(Boolean).join(", ");
  const line2 = [address.street, address.landmark, address.area].filter(Boolean).join(", ");
  const line3 = [address.city, address.district, address.state].filter(Boolean).join(", ");
  const line4 = [address.country, address.postalCode].filter(Boolean).join(" - ");
  const formatted = [line1, line2, line3, line4].filter(Boolean).join(", ");
  return formatted || fallback?.trim() || null;
}

export function hoursSummary(hours: BusinessHours | null | undefined, fallback?: string): string {
  if (hours?.temporaryClosure?.trim()) return `Temporarily closed: ${hours.temporaryClosure.trim()}`;
  const weekly = hours?.weekly ?? [];
  if (!weekly.length) return fallback?.trim() || "";
  return weekly
    .map((slot) => `${slot.day}: ${slot.closed ? "Closed" : `${slot.open || "-"} - ${slot.close || "-"}`}`)
    .join("; ");
}

export function firstPhoto(profile: BusinessProfile | null | undefined, type: BusinessPhoto["type"]): BusinessPhoto | null {
  const photos = (profile?.photos ?? [])
    .filter((photo) => photo.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return photos[0] ?? null;
}

export function photosByType(profile: BusinessProfile | null | undefined, type: BusinessPhoto["type"]): BusinessPhoto[] {
  return (profile?.photos ?? [])
    .filter((photo) => photo.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function withBusinessProfile(data: StorefrontData): StorefrontData {
  const existing = data.businessProfile;
  const contact = {
    ...emptyContact(data.shopName),
    ...existing?.contact,
    businessName: existing?.contact?.businessName || data.shopName,
    phone: existing?.contact?.phone ?? data.phone ?? null,
    whatsapp: existing?.contact?.whatsapp ?? data.whatsapp ?? null,
    email: existing?.contact?.email ?? data.email ?? null,
  };
  const profile: BusinessProfile = {
    ...emptyBusinessProfile(data.shopName),
    ...existing,
    photos: existing?.photos ?? [],
    contact,
    address: { ...emptyAddress(), ...existing?.address },
    location: { ...emptyLocation(), ...existing?.location },
    hours: existing?.hours ?? defaultBusinessHours(),
  };
  return {
    ...data,
    shopName: contact.businessName || data.shopName,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email,
    address: formattedAddress(profile.address, data.address),
    hours: hoursSummary(profile.hours, data.hours),
    businessProfile: profile,
  };
}

export function parseGoogleMapsCoordinates(value: string): { latitude: number; longitude: number } | null {
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  }
  return null;
}
