import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { MAX_SITES_PER_USER, validStorefront } from "@/lib/types";
import { withBusinessProfile } from "@/lib/businessProfile";

// GET /api/sites — the logged-in user's sites (for the dashboard).
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, published: true, updatedAt: true },
  });
  return NextResponse.json({ sites });
}

// POST /api/sites — save a new site (draft).
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const byUser = await rateLimit(`sites:user:${user.id}`, 30, 5 * 60 * 1000);
  const byIp = await rateLimit(`sites:ip:${clientIp(req)}`, 60, 5 * 60 * 1000);
  if (!byUser.ok || !byIp.ok) {
    return NextResponse.json({ error: "Too many requests. Slow down a little." }, { status: 429 });
  }

  const siteCount = await prisma.site.count({ where: { userId: user.id } });
  if (siteCount >= MAX_SITES_PER_USER) {
    return NextResponse.json(
      {
        error: `You've reached the limit of ${MAX_SITES_PER_USER} sites. Delete one you no longer need first.`,
        code: "site_limit_reached",
      },
      { status: 400 }
    );
  }

  let data: unknown;
  try {
    data = (await req.json())?.data;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!validStorefront(data)) {
    return NextResponse.json({ error: "Missing or invalid storefront data." }, { status: 400 });
  }

  const normalized = withBusinessProfile(data);
  const site = await prisma.site.create({
    data: {
      userId: user.id,
      name: normalized.shopName.trim(),
      data: JSON.stringify(normalized),
    },
  });
  return NextResponse.json({ site: { id: site.id, name: site.name } }, { status: 201 });
}
