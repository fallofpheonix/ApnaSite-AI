import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { validStorefront } from "@/lib/types";
import { generateSiteZip } from "@/lib/export";

type Params = { params: Promise<{ siteId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { siteId } = await params;

  const limited = rateLimit(`export:user:${user.id}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
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

  const zipBuffer = await generateSiteZip(data);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="apnasite-export.zip"',
    },
  });
}
