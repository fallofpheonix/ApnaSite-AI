import Anthropic from "@anthropic-ai/sdk";
import type { Language, StorefrontData } from "./types";

// 30s timeout per attempt, 2 retries with exponential backoff.
// A shop owner watching the loading screen shouldn't wait longer than ~90s worst-case.
const client = new Anthropic({ timeout: 30_000, maxRetries: 2 });

const STOREFRONT_SCHEMA = {
  type: "object",
  properties: {
    shopName: {
      type: "string",
      description: "The business's name, exactly as the owner said it.",
    },
    tagline: {
      type: "string",
      description:
        "A short, punchy one-line tagline (under 10 words) capturing what makes this business appealing.",
    },
    category: {
      type: "string",
      description:
        "A one or two word business category such as bakery, hair salon, hardware store, restaurant, cafe, grocery store, pharmacy, clothing store, or general if unclear. Always write this in English regardless of what language the rest of the content is written in - it is used internally for site styling, not shown as a translated sentence.",
    },
    aboutText: {
      type: "string",
      description:
        "A warm, professional 2-4 sentence About Us paragraph written in third person, based on what the owner described.",
    },
    hours: {
      type: "string",
      description:
        "A clean, human-readable display of business hours, e.g. '8:00 AM - 6:00 PM, Tue - Sun'. If not mentioned, write 'Contact us for hours'.",
    },
    products: {
      type: "array",
      description:
        "The products or services offered. Write a short, appealing one-sentence description for each even if the owner only gave a name.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "Price if mentioned, otherwise null.",
          },
        },
        required: ["name", "description", "price"],
        additionalProperties: false,
      },
    },
    address: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Physical address or location if mentioned, otherwise null.",
    },
    phone: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Phone number if mentioned, otherwise null.",
    },
    whatsapp: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "WhatsApp number if mentioned, otherwise null.",
    },
    email: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Email address if mentioned, otherwise null.",
    },
  },
  required: [
    "shopName",
    "tagline",
    "category",
    "aboutText",
    "hours",
    "products",
    "address",
    "phone",
    "whatsapp",
    "email",
  ],
  additionalProperties: false,
} as const;

const BASE_SYSTEM_PROMPT = `You turn a small business owner's spoken or typed description of their shop into structured content for a professional one-page website. The description often comes from imperfect speech-to-text - it may contain mid-word cutoffs, misheard words, filler ("um", "okay", "not a post"), or fragments in Hindi/Hinglish mixed with English. Do your best to infer the real intent from context (e.g. a shop name, a product, a type of business) even from noisy input.

Write warm, credible, non-generic copy a real customer would trust. Never invent specific facts (prices, hours, addresses) the owner didn't clearly mention - use null instead. Do write appealing descriptions for products/services even if the owner only named them. If the description is so sparse or garbled that you can only make out a business type or a couple of words, still produce your best reasonable guess for shopName/tagline/category rather than leaving them empty - a shop owner can edit placeholder text, but an empty site looks broken.`;

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: `Write every piece of copy (tagline, aboutText, hours, product names and descriptions) in natural, warm English.`,
  hi: `Write every piece of copy (tagline, aboutText, hours, product names and descriptions) in natural, warm Hindi using Devanagari script (देवनागरी लिपि). Write like a friendly local business would actually describe itself - not stiff textbook Hindi. Keep numerals (phone numbers, prices, hours) in standard Arabic numerals, as is standard on real Indian shop signage.`,
  hinglish: `Write every piece of copy (tagline, aboutText, hours, product names and descriptions) in natural Hinglish - the casual Hindi-English code-mixed style Indian shop owners actually use in WhatsApp messages and Instagram captions, written in Latin/Roman script (for example: "Sweet Crumbs mein aapko milega fresh bread aur cakes, roz taaza banaya jaata hai"). This is NOT a literal translation exercise and NOT formal Hindi or formal English - mix the two naturally the way a real shop owner would talk.`,
};

function buildSystemPrompt(language: Language): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${LANGUAGE_INSTRUCTIONS[language]}`;
}

export class AIGenerationError extends Error {
  code: "refusal" | "empty" | "parse_error";
  constructor(message: string, code: "refusal" | "empty" | "parse_error") {
    super(message);
    this.name = "AIGenerationError";
    this.code = code;
  }
}

/** Callback for streaming progress updates during generation. */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Generate storefront data from a business description.
 * Supports optional progress callbacks for streaming UI updates.
 */
export async function parseShopDescription(
  description: string,
  language: Language,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<StorefrontData> {
  onProgress?.(10, "Connecting to AI...");

  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: {
          type: "json_schema",
          schema: STOREFRONT_SCHEMA,
        },
      },
      system: buildSystemPrompt(language),
      messages: [
        {
          role: "user",
          content: `Business owner's description (this may be a raw, occasionally messy voice transcript):\n\n"""${description}"""`,
        },
      ],
    }, { signal });
    onProgress?.(80, "Processing AI response...");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw err;
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw err;
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError || err instanceof Anthropic.APIConnectionError) {
      throw new AIGenerationError(
        "The AI service is temporarily unavailable. Please try again in a moment.",
        "empty"
      );
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new AIGenerationError(
      "Claude couldn't process that description. Try rephrasing it or adding a bit more detail.",
      "refusal"
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AIGenerationError(
      "Claude didn't return any content for that description. Please try again.",
      "empty"
    );
  }

  onProgress?.(90, "Building your website...");

  try {
    const parsed = JSON.parse(textBlock.text) as Omit<StorefrontData, "language">;
    return { ...parsed, language };
  } catch {
    throw new AIGenerationError(
      "That description was too unclear to build a site from. Try adding your shop name, what you sell, and your hours.",
      "parse_error"
    );
  }
}
