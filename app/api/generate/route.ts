import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseShopDescription, AIGenerationError } from "@/lib/anthropic";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { sampleStorefront } from "@/lib/sampleData";
import type { Language } from "@/lib/types";

const MIN_WORD_COUNT = 4;
const VALID_LANGUAGES: Language[] = ["en", "hi", "hinglish"];

function hasLiveApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key !== "your-api-key-here");
}

export async function POST(req: NextRequest) {
  // Generation costs real money per call, so it's session-gated...
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in to generate a site." }, { status: 401 });
  }

  // ...and rate-limited per user AND per IP (a user with many cookies still
  // shares one IP bucket; a shared IP still gets per-user fairness).
  const byUser = rateLimit(`generate:user:${user.id}`, 10, 5 * 60 * 1000);
  const byIp = rateLimit(`generate:ip:${clientIp(req)}`, 20, 5 * 60 * 1000);
  if (!byUser.ok || !byIp.ok) {
    const retry = Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds);
    return NextResponse.json(
      { error: `You're generating too fast. Try again in about ${retry} seconds.` },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  let description: string;
  let language: Language;
  try {
    const body = await req.json();
    description = typeof body?.description === "string" ? body.description.trim() : "";
    language = VALID_LANGUAGES.includes(body?.language) ? body.language : "hinglish";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json(
      { error: "Please describe your business first." },
      { status: 400 }
    );
  }

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORD_COUNT) {
    return NextResponse.json(
      {
        error:
          "That description is too short to work with. Add a bit more - your shop name, what you sell, and your hours - then try again.",
      },
      { status: 400 }
    );
  }

  // No live API key yet → return hand-authored sample data so the rest of
  // the product (edit, save, publish, public site) stays fully usable.
  if (!hasLiveApiKey()) {
    return NextResponse.json({ data: sampleStorefront(description, language), sampleMode: true });
  }

  try {
    const data = await parseShopDescription(description, language);
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AIGenerationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Generate route auth failure:", err);
      return NextResponse.json(
        {
          error:
            "The server's Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.local.",
        },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Too many requests right now. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    console.error("Generate route failed:", err);
    return NextResponse.json(
      { error: "Something went wrong generating your site. Please try again." },
      { status: 502 }
    );
  }
}
