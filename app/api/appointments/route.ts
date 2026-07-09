import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = rateLimit(`appointments:post:${ip}`, 10, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, customerName, customerEmail, customerPhone, service, date, time, notes } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof siteId !== "string" || !siteId) {
    return NextResponse.json({ error: "siteId is required." }, { status: 400 });
  }
  if (typeof customerName !== "string" || !customerName.trim()) {
    return NextResponse.json({ error: "customerName is required." }, { status: 400 });
  }
  if (typeof customerEmail !== "string" || !customerEmail.trim()) {
    return NextResponse.json({ error: "customerEmail is required." }, { status: 400 });
  }
  if (typeof service !== "string" || !service.trim()) {
    return NextResponse.json({ error: "service is required." }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  }
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "time must be HH:MM." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json({ error: "date cannot be in the past." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { published: true } });
  if (!site || !site.published) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      siteId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: typeof customerPhone === "string" ? customerPhone.trim() : null,
      service: service.trim(),
      date,
      time,
      notes: typeof notes === "string" ? notes.trim() : null,
      status: "pending",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, appointmentId: appointment.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId query param required." }, { status: 400 });

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const appointments = await prisma.appointment.findMany({
    where: { siteId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const upcoming = appointments.filter((a) => a.date >= today && a.status !== "cancelled").length;

  return NextResponse.json({ appointments, upcoming });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { appointmentId, status } = (body ?? {}) as Record<string, unknown>;
  if (typeof appointmentId !== "string" || !appointmentId) {
    return NextResponse.json({ error: "appointmentId is required." }, { status: 400 });
  }
  if (status !== "confirmed" && status !== "cancelled") {
    return NextResponse.json({ error: "status must be 'confirmed' or 'cancelled'." }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { site: { select: { userId: true } } },
  });
  if (!appointment || appointment.site.userId !== user.id) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  return NextResponse.json({ ok: true });
}
