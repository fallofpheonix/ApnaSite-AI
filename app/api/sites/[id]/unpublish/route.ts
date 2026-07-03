import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/sites/:id/unpublish — takes the site offline. The slug stays
// reserved on the row so republishing brings back the exact same URL.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  await prisma.site.update({ where: { id }, data: { published: false } });
  return NextResponse.json({ ok: true });
}
