import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { validStorefront } from "@/lib/types";
import { withBusinessProfile } from "@/lib/businessProfile";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

/** Loads the site only if it belongs to the logged-in user. Returning the
 * same 404 for "doesn't exist" and "not yours" avoids leaking which site IDs
 * exist. */
async function ownedSite(req: NextRequest, id: string) {
  const user = await getSessionUser(req);
  if (!user) return { error: NextResponse.json({ error: "Please log in." }, { status: 401 }) };
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site || site.userId !== user.id) {
    return { error: NextResponse.json({ error: "Site not found." }, { status: 404 }) };
  }
  return { site };
}

// GET /api/sites/:id — full site data, for re-opening in the editor.
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await ownedSite(req, id);
  if ("error" in result) return result.error;
  const { site } = result;
  let data: unknown;
  try {
    data = JSON.parse(site.data);
  } catch {
    return NextResponse.json({ error: "Saved site data is corrupted." }, { status: 500 });
  }
  if (!validStorefront(data)) {
    return NextResponse.json({ error: "Saved site data is invalid." }, { status: 500 });
  }

  return NextResponse.json({
    site: {
      id: site.id,
      name: site.name,
      slug: site.slug,
      published: site.published,
      publishedAt: site.publishedAt?.toISOString() ?? null,
      data: withBusinessProfile(data),
    },
  });
}

// PUT /api/sites/:id — save edits.
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await ownedSite(req, id);
  if ("error" in result) return result.error;

  // Writes are cheap but not free (JSON validation + db) — bound them.
  const limited = await rateLimit(`sites-write:ip:${clientIp(req)}`, 120, 5 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many saves. Give it a few seconds." }, { status: 429 });
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
  await prisma.site.update({
    where: { id },
    data: { name: normalized.shopName.trim(), data: JSON.stringify(normalized) },
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/sites/:id — removes the site (and its public URL, if live).
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await ownedSite(req, id);
  if ("error" in result) return result.error;

  await prisma.site.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/sites/:id — update slug (and optionally publishAt).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await ownedSite(req, id);
  if ("error" in result) return result.error;

  let body: { slug?: string; publishAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.slug !== undefined) {
    const raw = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
    if (!raw) {
      return NextResponse.json({ error: "Slug must contain at least one letter or number." }, { status: 400 });
    }
    if (raw.length > 100) {
      return NextResponse.json({ error: "Slug must be 100 characters or fewer." }, { status: 400 });
    }
    const finalSlug = slugify(raw);
    const existing = await prisma.site.findUnique({ where: { slug: finalSlug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "That URL is already taken. Try another." }, { status: 409 });
    }
    updates.slug = finalSlug;
  }

  if (body.publishAt !== undefined) {
    updates.publishAt = body.publishAt ? new Date(body.publishAt) : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await prisma.site.update({ where: { id }, data: updates });
  return NextResponse.json({ ok: true, ...(updates.slug ? { slug: updates.slug } : {}) });
}
