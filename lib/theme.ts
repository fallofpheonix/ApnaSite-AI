export interface Theme {
  id: string;
  label: string;
  /** Public Google Fonts family name used for headings. */
  fontDisplayName: string;
  /** Public Google Fonts family name used for body copy. */
  fontBodyName: string;
  /** Whether the display face should lean on its italic cut for accents. */
  displayItalicAccent: boolean;
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDeep: string;
  accentText: string;
  cardBg: string;
  border: string;
}

// Each theme is a deliberate color + type pairing for that category's own
// world, not a hue-swap of one template. Warm neutrals are chosen with a
// hue bias toward each theme's accent rather than defaulting to grey.
const THEMES: Record<string, Theme> = {
  bakery: {
    id: "bakery",
    label: "Warm Hearth",
    fontDisplayName: "Newsreader",
    fontBodyName: "Karla",
    displayItalicAccent: true,
    bg: "#F6EDE0",
    bgAlt: "#EDDDC6",
    text: "#3A2417",
    textMuted: "#8A6E56",
    accent: "#8C3A2E",
    accentDeep: "#6E2C22",
    accentText: "#FFF8F0",
    cardBg: "#FFFBF4",
    border: "#E3CEAE",
  },
  salon: {
    id: "salon",
    label: "Quiet Bloom",
    fontDisplayName: "Cormorant",
    fontBodyName: "Karla",
    displayItalicAccent: true,
    bg: "#FBEEF3",
    bgAlt: "#F3DCE6",
    text: "#3E2438",
    textMuted: "#8A6B80",
    accent: "#5B3556",
    accentDeep: "#432740",
    accentText: "#FBEEF3",
    cardBg: "#FFFBFD",
    border: "#EBCEDD",
  },
  hardware: {
    id: "hardware",
    label: "Site Ready",
    fontDisplayName: "Barlow Condensed",
    fontBodyName: "Barlow",
    displayItalicAccent: false,
    bg: "#EDEFF2",
    bgAlt: "#DBDFE5",
    text: "#20242B",
    textMuted: "#565F6B",
    accent: "#D9600C",
    accentDeep: "#B34E08",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#C7CDD6",
  },
  restaurant: {
    id: "restaurant",
    label: "Evening Table",
    fontDisplayName: "Newsreader",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#FBF3E4",
    bgAlt: "#F0DFC0",
    text: "#301A1E",
    textMuted: "#7D6552",
    accent: "#6E1F2A",
    accentDeep: "#54171F",
    accentText: "#FBF3E4",
    cardBg: "#FFFBF2",
    border: "#E6D3AC",
  },
  grocery: {
    id: "grocery",
    label: "Fresh Market",
    fontDisplayName: "Bricolage Grotesque",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#F1F7EE",
    bgAlt: "#DEEBD7",
    text: "#1E3220",
    textMuted: "#547157",
    accent: "#E2762C",
    accentDeep: "#BC5F1F",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#CBE0C2",
  },
  pharmacy: {
    id: "pharmacy",
    label: "Clear Care",
    fontDisplayName: "Bricolage Grotesque",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#EEF5F7",
    bgAlt: "#D9E9EC",
    text: "#152A38",
    textMuted: "#4C6E7A",
    accent: "#1B3A4B",
    accentDeep: "#0F2733",
    accentText: "#EEF5F7",
    cardBg: "#FFFFFF",
    border: "#C8DEE3",
  },
  clothing: {
    id: "clothing",
    label: "Studio Line",
    fontDisplayName: "Cormorant",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#F3EDE3",
    bgAlt: "#E5D9C7",
    text: "#201D1A",
    textMuted: "#6E655A",
    accent: "#A67C3D",
    accentDeep: "#8A6530",
    accentText: "#FFFFFF",
    cardBg: "#FFFDF9",
    border: "#DBCDB2",
  },
  sweets: {
    // Mithai-box festivity: rose-cream card stock, deep gulab rose, a
    // celebratory italic serif. Warmer and pinker than bakery's hearth tones.
    id: "sweets",
    label: "Utsav Rose",
    fontDisplayName: "Fraunces",
    fontBodyName: "Karla",
    displayItalicAccent: true,
    bg: "#FBEFE9",
    bgAlt: "#F5DCD4",
    text: "#451F26",
    textMuted: "#96606B",
    accent: "#A62B4D",
    accentDeep: "#82203C",
    accentText: "#FDF3EF",
    cardBg: "#FFFAF6",
    border: "#EEC9C0",
  },
  kirana: {
    // The everyday corner shop: sun-warmed turmeric paper with a dependable
    // leaf green. Friendly and utilitarian, distinct from grocery's cool
    // green-field palette with its orange accent.
    id: "kirana",
    label: "Rozana",
    fontDisplayName: "Bricolage Grotesque",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#FAF4E3",
    bgAlt: "#F1E5C2",
    text: "#2C2512",
    textMuted: "#7A6C48",
    accent: "#3E7D3B",
    accentDeep: "#2E6030",
    accentText: "#FFFFFF",
    cardBg: "#FFFCF1",
    border: "#E5D8AB",
  },
  tailor: {
    // Unbleached linen and a spruce-green thread; Marcellus's engraved
    // capitals read like a chalk-marked pattern block - craft, not fashion
    // retail (that's the clothing theme's gold-on-ecru studio look).
    id: "tailor",
    label: "Measured Thread",
    fontDisplayName: "Marcellus",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#F1EDE6",
    bgAlt: "#E3DBCC",
    text: "#262924",
    textMuted: "#6C6A58",
    accent: "#34594E",
    accentDeep: "#26443B",
    accentText: "#F1EDE6",
    cardBg: "#FDFBF6",
    border: "#D8CFB9",
  },
  jewellery: {
    // Dark velvet display case: deep plum ground so gold reads as metal, the
    // way jewellers actually light their windows. One of two dark themes.
    id: "jewellery",
    label: "Gilded Velvet",
    fontDisplayName: "Cormorant",
    fontBodyName: "Karla",
    displayItalicAccent: true,
    bg: "#221A29",
    bgAlt: "#2D2236",
    text: "#F4ECDC",
    textMuted: "#B3A38C",
    accent: "#C79A2E",
    accentDeep: "#A67E1E",
    accentText: "#241B08",
    cardBg: "#2B2133",
    border: "#443655",
  },
  gym: {
    // Charcoal iron and a high-vis lime that only works on dark ground.
    // Condensed caps for the poster-on-the-wall energy of a real akhada/gym.
    id: "gym",
    label: "Iron Pulse",
    fontDisplayName: "Barlow Condensed",
    fontBodyName: "Barlow",
    displayItalicAccent: false,
    bg: "#191B1F",
    bgAlt: "#23262C",
    text: "#F1F3F4",
    textMuted: "#9BA4AE",
    accent: "#C6E940",
    accentDeep: "#A7C92B",
    accentText: "#171A10",
    cardBg: "#20242A",
    border: "#363B44",
  },
  tuition: {
    // Aged copybook paper with fountain-pen indigo - studious and calm,
    // a serif that parents read as "serious about results".
    id: "tuition",
    label: "Copybook",
    fontDisplayName: "Newsreader",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#F6F2E8",
    bgAlt: "#EAE3CE",
    text: "#232838",
    textMuted: "#6B685C",
    accent: "#35427E",
    accentDeep: "#27305F",
    accentText: "#F6F2E8",
    cardBg: "#FFFDF6",
    border: "#DCD3B9",
  },
  electronics: {
    // Cool bench-top grey with one confident circuit blue; Sora's geometric
    // letterforms carry the technical feel without going full sci-fi.
    id: "electronics",
    label: "Signal",
    fontDisplayName: "Sora",
    fontBodyName: "Barlow",
    displayItalicAccent: false,
    bg: "#EFF2F6",
    bgAlt: "#DFE5ED",
    text: "#131C2A",
    textMuted: "#556274",
    accent: "#1B5FD0",
    accentDeep: "#1348A3",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#C9D2DF",
  },
  general: {
    id: "general",
    label: "Steady Trust",
    fontDisplayName: "Newsreader",
    fontBodyName: "Karla",
    displayItalicAccent: false,
    bg: "#F2F0EC",
    bgAlt: "#E2DFD7",
    text: "#1D2430",
    textMuted: "#5C6472",
    accent: "#223142",
    accentDeep: "#141C27",
    accentText: "#F2F0EC",
    cardBg: "#FFFFFF",
    border: "#D6D2C7",
  },
};

// Order matters: more specific categories sit above broader ones so e.g.
// "sweet shop" hits sweets before bakery's /cake/, "kirana store" hits kirana
// before grocery's /market/, and "tailor boutique" hits tailor before
// clothing's /fashion/.
const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/sweet|mithai|mithaai|halwai|confection|laddu|ladoo|barfi|jalebi/i, "sweets"],
  [/kirana|provision|general\s*store|daily needs/i, "kirana"],
  [/tailor|boutique|stitch|silai|darzi|dressmak/i, "tailor"],
  [/jewel|ornament|sunar|gahna|gahne/i, "jewellery"],
  [/gym|fitness|yoga|crossfit|workout|akhara|akhada/i, "gym"],
  [/tuition|coaching|academy|classes|institute|tutor/i, "tuition"],
  [/mobile|electronic|phone|gadget|computer|laptop|repair|recharge/i, "electronics"],
  [/bak(e|ery)|cake|pastry|patisserie/i, "bakery"],
  [/salon|spa|beauty|hair|nail|barber/i, "salon"],
  [/hardware|tool|construction|plumbing|electrical/i, "hardware"],
  [/restaurant|cafe|caf[eé]|diner|eatery|bistro|food/i, "restaurant"],
  [/grocery|supermarket|market|produce|farm/i, "grocery"],
  [/pharmac|clinic|medical|health|drugstore/i, "pharmacy"],
  [/cloth|apparel|fashion|garment/i, "clothing"],
];

export function resolveTheme(category: string): Theme {
  const normalized = (category || "").trim();
  for (const [pattern, themeId] of KEYWORD_MAP) {
    if (pattern.test(normalized)) {
      return THEMES[themeId];
    }
  }
  return THEMES.general;
}

export function listThemes(): Theme[] {
  return Object.values(THEMES);
}
