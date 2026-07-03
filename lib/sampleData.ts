import type { Language, StorefrontData } from "./types";
import { resolveTheme } from "./theme";

// Hand-authored stand-in content used when no ANTHROPIC_API_KEY is configured,
// so the whole flow (generate → edit → save → publish → public site) can be
// exercised without a live Claude call. The copy is deliberately good enough
// to look like a real result, and the API response is flagged sampleMode:true
// so the UI can tell the user their description wasn't actually processed.
//
// The one nod to the user's input: we run their raw description through the
// same category keyword matcher the real pipeline uses, so typing "gym" or
// "jewellery shop" still exercises that theme even in sample mode.

const SAMPLES: Record<Language, StorefrontData> = {
  en: {
    shopName: "Sharma General Store",
    tagline: "Everything your home needs, just around the corner",
    category: "general",
    aboutText:
      "Sharma General Store has been serving the neighbourhood for over a decade with daily essentials, friendly service, and fair prices. From groceries to household items, we keep the shelves stocked with what local families actually use. Drop in, or send us a message and we'll keep your order ready.",
    hours: "9:00 AM - 9:00 PM, Mon - Sat",
    products: [
      {
        name: "Daily Groceries",
        description: "Atta, rice, dals, oils and spices - restocked fresh every week.",
        price: null,
      },
      {
        name: "Household Essentials",
        description: "Cleaning supplies, toiletries and everyday items for the whole family.",
        price: null,
      },
      {
        name: "Home Delivery",
        description: "Free delivery within 2 km for orders above ₹500 - just WhatsApp us your list.",
        price: "Free above ₹500",
      },
    ],
    address: "Shop 4, Main Market Road",
    phone: "98765 43210",
    whatsapp: "98765 43210",
    email: null,
    language: "en",
  },
  hi: {
    shopName: "शर्मा जनरल स्टोर",
    tagline: "घर की हर ज़रूरत, आपके पड़ोस में",
    category: "general",
    aboutText:
      "शर्मा जनरल स्टोर पिछले दस सालों से मोहल्ले की सेवा में है। रोज़मर्रा का सामान, सही दाम और अपनेपन वाली सेवा - यही हमारी पहचान है। किराना से लेकर घरेलू सामान तक, सब कुछ एक ही दुकान पर मिलता है।",
    hours: "सुबह 9 बजे - रात 9 बजे, सोम - शनि",
    products: [
      {
        name: "रोज़ का किराना",
        description: "आटा, चावल, दाल, तेल और मसाले - हर हफ़्ते ताज़ा स्टॉक।",
        price: null,
      },
      {
        name: "घरेलू सामान",
        description: "सफ़ाई का सामान, साबुन-शैम्पू और घर की हर छोटी-बड़ी चीज़।",
        price: null,
      },
      {
        name: "होम डिलीवरी",
        description: "₹500 से ऊपर के ऑर्डर पर 2 किमी तक मुफ़्त डिलीवरी - WhatsApp पर लिस्ट भेजिए।",
        price: "₹500 से ऊपर मुफ़्त",
      },
    ],
    address: "दुकान 4, मेन मार्केट रोड",
    phone: "98765 43210",
    whatsapp: "98765 43210",
    email: null,
    language: "hi",
  },
  hinglish: {
    shopName: "Sharma General Store",
    tagline: "Ghar ki har zaroorat, bas paas mein",
    category: "general",
    aboutText:
      "Sharma General Store pichhle das saal se mohalle ki service mein hai. Daily ka saaman, sahi daam aur apnepan wali service - yahi hamari pehchaan hai. Kirana se lekar ghar ke saaman tak, sab kuch ek hi dukaan par.",
    hours: "9 AM - 9 PM, Mon - Sat",
    products: [
      {
        name: "Daily Kirana",
        description: "Atta, chawal, dal, tel aur masale - har hafte fresh stock.",
        price: null,
      },
      {
        name: "Ghar ka Saaman",
        description: "Safai ka saaman, toiletries aur family ke liye roz ki cheezein.",
        price: null,
      },
      {
        name: "Home Delivery",
        description: "₹500 se upar ke order par 2 km tak free delivery - WhatsApp par list bhejiye.",
        price: "₹500+ pe free",
      },
    ],
    address: "Shop 4, Main Market Road",
    phone: "98765 43210",
    whatsapp: "98765 43210",
    email: null,
    language: "hinglish",
  },
};

export function sampleStorefront(description: string, language: Language): StorefrontData {
  const base = SAMPLES[language];
  // Let the description drive the theme so all categories are testable
  // without a live key. resolveTheme's keyword matcher works fine on raw
  // description text ("mera gym hai" → gym theme).
  const detected = resolveTheme(description);
  return { ...base, category: detected.id === "general" ? base.category : detected.id };
}
