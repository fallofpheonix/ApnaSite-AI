import Anthropic from "@anthropic-ai/sdk";
import type { StorefrontData } from "./types";

const client = new Anthropic({ timeout: 30_000, maxRetries: 2 });

const BUSINESS_TEMPLATES: Record<string, StorefrontData> = {
  bakery: {
    shopName: "Sweet Crumbs Bakery",
    tagline: "Freshly baked happiness, every single day",
    category: "bakery",
    aboutText:
      "Sweet Crumbs Bakery has been serving the community with handcrafted breads, cakes, and pastries since day one. Every item is baked fresh using traditional recipes and the finest ingredients. Whether it's a morning bun or a wedding cake, we put love into every bite.",
    hours: "7:00 AM - 8:00 PM, Mon - Sun",
    products: [
      { name: "Sourdough Loaf", description: "Classic tangy sourdough, crusty outside, soft inside", price: "₹180" },
      { name: "Chocolate Cake", description: "Rich, moist chocolate cake with ganache frosting", price: "₹650" },
      { name: "Butter Croissant", description: "Flaky, buttery layers baked to golden perfection", price: "₹80" },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  restaurant: {
    shopName: "Spice Garden",
    tagline: "Authentic flavours, made with passion",
    category: "restaurant",
    aboutText:
      "Spice Garden brings the rich flavours of traditional cuisine to your table. Our chefs craft every dish with fresh, locally sourced ingredients and time-honoured recipes. From hearty curries to sizzling tandoor specials, every meal is an experience.",
    hours: "11:00 AM - 11:00 PM, Tue - Sun",
    products: [
      { name: "Butter Chicken", description: "Creamy, mildly spiced chicken in a rich tomato gravy", price: "₹320" },
      { name: "Paneer Tikka", description: "Smoky grilled cottage cheese with mint chutney", price: "₹280" },
      { name: "Biryani", description: "Fragrant basmati rice layered with spiced vegetables and saffron", price: "₹250" },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  salon: {
    shopName: "Glow Studio",
    tagline: "Look good, feel great",
    category: "hair salon",
    aboutText:
      "Glow Studio is your go-to destination for hair styling, grooming, and beauty treatments. Our skilled stylists stay on top of the latest trends while keeping your personal style at the centre of everything. Walk in looking good, walk out feeling great.",
    hours: "10:00 AM - 8:00 PM, Mon - Sat",
    products: [
      { name: "Haircut & Styling", description: "Expert cut and blow-dry tailored to your face shape", price: "₹400" },
      { name: "Hair Colour", description: "Full colour, highlights, or balayage with premium products", price: "₹1200" },
      { name: "Beard Grooming", description: "Precision trim, shaping, and hot towel finish", price: "₹200" },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  cafe: {
    shopName: "The Brew House",
    tagline: "Great coffee, great vibes",
    category: "cafe",
    aboutText:
      "The Brew House is a cosy neighbourhood cafe serving specialty coffee, fresh pastries, and light bites. Whether you're catching up with friends or need a quiet corner to work, we've got the perfect brew waiting for you.",
    hours: "8:00 AM - 9:00 PM, Mon - Sun",
    products: [
      { name: "Cappuccino", description: "Rich espresso with velvety steamed milk", price: "₹180" },
      { name: "Avocado Toast", description: "Sourdough topped with smashed avocado, chilli flakes, and lime", price: "₹220" },
      { name: "Cold Brew", description: "Slow-steeped for 20 hours, smooth and refreshing", price: "₹200" },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  grocery: {
    shopName: "Fresh Mart",
    tagline: "Farm fresh, every day",
    category: "grocery store",
    aboutText:
      "Fresh Mart brings you the freshest produce, pantry staples, and everyday essentials at honest prices. We source directly from local farmers and trusted suppliers so your family gets the best — every single day.",
    hours: "7:00 AM - 10:00 PM, Mon - Sun",
    products: [
      { name: "Fresh Vegetables", description: "Locally sourced seasonal vegetables, hand-picked daily", price: null },
      { name: "Organic Fruits", description: "Certified organic fruits from trusted farms", price: null },
      { name: "Dairy & Eggs", description: "Farm-fresh milk, curd, paneer, and free-range eggs", price: null },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  clothing: {
    shopName: "Thread & Style",
    tagline: "Wear your story",
    category: "clothing store",
    aboutText:
      "Thread & Style curates clothing that lets you express who you are. From everyday basics to statement pieces, our collection is designed for comfort, quality, and effortless style. Come find your next favourite outfit.",
    hours: "11:00 AM - 9:00 PM, Mon - Sun",
    products: [
      { name: "Classic Cotton Tee", description: "Soft, breathable cotton in timeless colours", price: "₹599" },
      { name: "Denim Jacket", description: "Vintage-wash denim, built to last and age beautifully", price: "₹1999" },
      { name: "Linen Shirt", description: "Lightweight linen perfect for warm days", price: "₹899" },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
  pharmacy: {
    shopName: "HealthFirst Pharmacy",
    tagline: "Your health, our priority",
    category: "pharmacy",
    aboutText:
      "HealthFirst Pharmacy is your trusted neighbourhood chemist. We stock genuine medicines, health supplements, and personal care products at fair prices. Our knowledgeable staff is always ready to help you find what you need.",
    hours: "8:00 AM - 10:00 PM, Mon - Sun",
    products: [
      { name: "Prescription Medicines", description: "Genuine medicines from licensed manufacturers", price: null },
      { name: "Health Supplements", description: "Vitamins, minerals, and wellness essentials", price: null },
      { name: "Personal Care", description: "Skincare, haircare, and hygiene products", price: null },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  },
};

function detectBusinessType(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  const keywords: Record<string, string[]> = {
    bakery: ["bakery", "bak", "bread", "cake", "pastry", "cookies", "muffins", "bake"],
    restaurant: ["restaurant", "food", "dining", "cuisine", "curry", "biryani", "tandoor", "eatery", "kitchen"],
    salon: ["salon", "hair", "beauty", "grooming", "styling", "barber", "spa", "makeup"],
    cafe: ["cafe", "coffee", "espresso", "latte", "cappuccino", "brew", "tea shop"],
    grocery: ["grocery", "groceries", "vegetable", "fruit", "supermarket", "kirana", "store", "mart"],
    clothing: ["clothing", "clothes", "fashion", "apparel", "boutique", "wear", "garment"],
    pharmacy: ["pharmacy", "medicine", "chemist", "drugstore", "health store"],
  };

  for (const [type, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return type;
  }
  return null;
}

function sampleFallback(prompt: string): StorefrontData {
  const detected = detectBusinessType(prompt);
  if (detected && BUSINESS_TEMPLATES[detected]) {
    return { ...BUSINESS_TEMPLATES[detected] };
  }
  return {
    shopName: "Your Business",
    tagline: "Quality you can trust",
    category: "general",
    aboutText:
      "We're a passionate team dedicated to providing excellent products and outstanding service to our community. Visit us today and see what makes us different.",
    hours: "Contact us for hours",
    products: [
      { name: "Our Product", description: "Quality product tailored to your needs", price: null },
    ],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
  };
}

export async function generateWithFallback(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") return textBlock.text;
  } catch {
    // Fall through to sample fallback
  }

  const sample = sampleFallback(prompt);
  return JSON.stringify(sample, null, 2);
}

export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") return textBlock.text;
  } catch {
    // Fall through to sample fallback
  }

  const sample = sampleFallback(prompt);
  return JSON.stringify(sample, null, 2);
}
