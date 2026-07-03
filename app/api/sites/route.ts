import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validStorefront } from "@/lib/types";

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

  let data: unknown;
  try {
    data = (await req.json())?.data;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!validStorefront(data)) {
    return NextResponse.json({ error: "Missing or invalid storefront data." }, { status: 400 });
  }

  const site = await prisma.site.create({
    data: {
      userId: user.id,
      name: data.shopName.trim(),
      data: JSON.stringify(data),
    },
  });
  return NextResponse.json({ site: { id: site.id, name: site.name } }, { status: 201 });
}
