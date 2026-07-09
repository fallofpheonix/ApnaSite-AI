import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RATE_WINDOW = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const domains = await prisma.domain.findMany({ where: { siteId } });
  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const limited = rateLimit(`domains:post:${user.id}`, 5, RATE_WINDOW);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: { siteId?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, domain } = body;
  if (!siteId || !domain) {
    return NextResponse.json({ error: "siteId and domain are required." }, { status: 400 });
  }

  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: "Invalid domain format." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const existing = await prisma.domain.findUnique({ where: { domain } });
  if (existing) {
    return NextResponse.json({ error: "Domain is already registered." }, { status: 409 });
  }

  const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const created = await prisma.domain.create({
    data: { siteId, domain, verificationToken },
  });

  return NextResponse.json(
    {
      ok: true,
      domainId: created.id,
      verificationToken,
      instructions:
        "Add a TXT record with your verification token to your domain's DNS settings. " +
        "Once added, call PATCH /api/domains to verify.",
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  let body: { domainId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { domainId } = body;
  if (!domainId) {
    return NextResponse.json({ error: "domainId is required." }, { status: 400 });
  }

  const domain = await prisma.domain.findUnique({ where: { id: domainId }, include: { site: true } });
  if (!domain || domain.site.userId !== user.id) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  await prisma.domain.delete({ where: { id: domainId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  let body: { domainId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { domainId } = body;
  if (!domainId) {
    return NextResponse.json({ error: "domainId is required." }, { status: 400 });
  }

  const domain = await prisma.domain.findUnique({ where: { id: domainId }, include: { site: true } });
  if (!domain || domain.site.userId !== user.id) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  await prisma.domain.update({ where: { id: domainId }, data: { verified: true } });
  return NextResponse.json({ ok: true, verified: true });
}
