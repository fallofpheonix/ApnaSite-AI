import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { validStorefront, type StorefrontData } from "@/lib/types";

const client = new Anthropic({ timeout: 30_000, maxRetries: 2 });
const RATE_WINDOW = 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a website editor. The user will give you a natural language instruction. Return ONLY a JSON object with the fields to update. Available fields: shopName, tagline, category, aboutText, hours, address, phone, whatsapp, email, themeOverride, faq (array of {question, answer}). For product changes, return {products: [...]} with the full updated array. For FAQ changes, return {faq: [...]} with the full updated array. Never invent facts - only modify what the user asks.`;

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const limited = await rateLimit(`prompt:user:${user.id}`, 20, RATE_WINDOW);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: { siteId?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, prompt } = body;
  if (!siteId || !prompt) {
    return NextResponse.json({ error: "siteId and prompt are required." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  let currentData: StorefrontData;
  try {
    currentData = JSON.parse(site.data) as StorefrontData;
  } catch {
    return NextResponse.json({ error: "Saved site data is corrupted." }, { status: 500 });
  }

  if (!validStorefront(currentData)) {
    return NextResponse.json({ error: "Saved site data is invalid." }, { status: 500 });
  }

  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current site data:\n${JSON.stringify(currentData, null, 2)}\n\nInstruction: ${prompt}`,
        },
      ],
    });
  } catch (err) {
    console.error("Prompt editing failed:", err);
    return NextResponse.json(
      { error: "AI editing failed. Please try again." },
      { status: 500 }
    );
  }

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return NextResponse.json({ error: "AI returned empty response." }, { status: 500 });
  }

  let patch: Partial<StorefrontData>;
  try {
    patch = JSON.parse(block.text);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
  }

  const mergedData: StorefrontData = { ...currentData, ...patch };

  if (!validStorefront(mergedData)) {
    return NextResponse.json({ error: "AI produced invalid site data." }, { status: 500 });
  }

  await prisma.site.update({
    where: { id: siteId },
    data: { name: mergedData.shopName.trim(), data: JSON.stringify(mergedData) },
  });

  return NextResponse.json({ ok: true, data: mergedData });
}
