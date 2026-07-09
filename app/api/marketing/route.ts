import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { validStorefront } from "@/lib/types";
import {
  generateAdCopy,
  generateEmailCampaign,
  generateSocialPost,
} from "@/lib/marketing";

const RATE_WINDOW = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const limited = rateLimit(`marketing:user:${user.id}`, 10, RATE_WINDOW);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: {
    siteId?: string;
    type?: "ad_copy" | "email_campaign" | "social_post";
    platform?: string;
    goal?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, type, platform, goal } = body;
  if (!siteId || !type) {
    return NextResponse.json({ error: "siteId and type are required." }, { status: 400 });
  }

  const validTypes = ["ad_copy", "email_campaign", "social_post"] as const;
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  let data: unknown;
  try {
    data = JSON.parse(site.data);
  } catch {
    return NextResponse.json({ error: "Saved site data is corrupted." }, { status: 500 });
  }

  if (!validStorefront(data)) {
    return NextResponse.json({ error: "Saved site data is invalid." }, { status: 500 });
  }

  let content: string;
  try {
    switch (type) {
      case "ad_copy":
        content = await generateAdCopy(data, platform ?? "facebook");
        break;
      case "email_campaign":
        content = await generateEmailCampaign(data, goal ?? "promotion");
        break;
      case "social_post":
        content = await generateSocialPost(data, platform ?? "instagram");
        break;
    }
  } catch (err) {
    console.error("Marketing generation failed:", err);
    return NextResponse.json(
      { error: "Marketing content generation failed. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, content });
}
