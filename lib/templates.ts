import type { StorefrontData } from "./types";

export interface SiteTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Whether this template requires Pro plan. */
  pro?: boolean;
  data: StorefrontData;
}

export const TEMPLATES: SiteTemplate[] = [
  {
    id: "bakery-warm",
    name: "Sweet Bakery",
    category: "bakery",
    description: "Warm, inviting design for bakeries and sweet shops",
    data: {
      shopName: "Sweet Crumbs Bakery",
      tagline: "Freshly baked happiness, every single day",
      category: "bakery",
      aboutText: "Sweet Crumbs Bakery has been serving the community with handcrafted breads, cakes, and pastries. Every item is baked fresh using traditional recipes and the finest ingredients.",
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
      faq: [
        { question: "Do you take custom cake orders?", answer: "Yes! We love creating custom cakes for birthdays, weddings, and special occasions. Contact us at least 3 days in advance." },
        { question: "Are your products eggless?", answer: "We offer a selection of eggless options. Ask our staff for the full list when you visit." },
      ],
    },
  },
  {
    id: "restaurant-spice",
    name: "Spice Garden",
    category: "restaurant",
    description: "Rich, vibrant design for restaurants and eateries",
    data: {
      shopName: "Spice Garden Restaurant",
      tagline: "Authentic flavours, made with passion",
      category: "restaurant",
      aboutText: "Spice Garden brings the rich flavours of traditional cuisine to your table. Our chefs craft every dish with fresh, locally sourced ingredients and time-honoured recipes.",
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
      faq: [
        { question: "Do you offer home delivery?", answer: "Yes! We deliver within a 5 km radius. Order directly on WhatsApp or call us." },
        { question: "Is parking available?", answer: "Yes, we have free parking for cars and bikes right outside the restaurant." },
      ],
    },
  },
  {
    id: "salon-glow",
    name: "Glow Studio",
    category: "hair salon",
    description: "Elegant, modern design for salons and beauty studios",
    data: {
      shopName: "Glow Studio",
      tagline: "Look good, feel great",
      category: "hair salon",
      aboutText: "Glow Studio is your go-to destination for hair styling, grooming, and beauty treatments. Our skilled stylists stay on top of the latest trends while keeping your personal style at the centre.",
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
      faq: [
        { question: "Do I need an appointment?", answer: "Walk-ins are welcome, but we recommend booking ahead for weekends to avoid waiting." },
        { question: "What products do you use?", answer: "We use only premium, salon-grade products from trusted brands." },
      ],
    },
  },
  {
    id: "cafe-brew",
    name: "The Brew House",
    category: "cafe",
    description: "Cozy, relaxed design for cafes and coffee shops",
    data: {
      shopName: "The Brew House",
      tagline: "Great coffee, great vibes",
      category: "cafe",
      aboutText: "The Brew House is a cosy neighbourhood cafe serving specialty coffee, fresh pastries, and light bites. Whether you're catching up with friends or need a quiet corner to work.",
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
      faq: [
        { question: "Do you have WiFi?", answer: "Yes! Free WiFi for all customers. Ask our staff for the password." },
        { question: "Can I work from here?", answer: "Absolutely! We have power outlets at most tables and a quiet corner for focused work." },
      ],
    },
  },
  {
    id: "grocery-fresh",
    name: "Fresh Mart",
    category: "grocery store",
    description: "Clean, trustworthy design for grocery and kirana stores",
    data: {
      shopName: "Fresh Mart",
      tagline: "Farm fresh, every day",
      category: "grocery store",
      aboutText: "Fresh Mart brings you the freshest produce, pantry staples, and everyday essentials at honest prices. We source directly from local farmers and trusted suppliers.",
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
      language: "hinglish",
      faq: [
        { question: "Kya aap home delivery karte hain?", answer: "Haan! ₹500 se zyada order pe free delivery hai. WhatsApp pe order karein." },
        { question: "新鲜 kaise guarantee karte hain?", answer: "Hum directly kisan se khareedte hain. Har din taaza samaan aata hai." },
      ],
    },
  },
  {
    id: "clothing-style",
    name: "Thread & Style",
    category: "clothing store",
    description: "Trendy, fashionable design for clothing boutiques",
    data: {
      shopName: "Thread & Style",
      tagline: "Wear your story",
      category: "clothing store",
      aboutText: "Thread & Style curates clothing that lets you express who you are. From everyday basics to statement pieces, our collection is designed for comfort, quality, and effortless style.",
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
      faq: [
        { question: "Do you ship online orders?", answer: "Yes! We ship across India. Free shipping on orders above ₹2000." },
        { question: "What's your return policy?", answer: "Easy returns within 7 days for unworn items with tags attached." },
      ],
    },
  },
];

export function getTemplateById(id: string): SiteTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
