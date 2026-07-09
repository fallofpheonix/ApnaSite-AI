import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = await rateLimit(`contact:post:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, name, email, phone, message } = (body ?? {}) as Record<string, unknown>;

  if (typeof siteId !== "string" || !siteId) {
    return NextResponse.json({ error: "siteId is required." }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return NextResponse.json({ error: "message is required and must be ≤2000 characters." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { published: true } });
  if (!site || !site.published) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  await prisma.contactMessage.create({
    data: {
      siteId,
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      message: message.trim(),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
