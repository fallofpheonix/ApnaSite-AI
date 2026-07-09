import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = rateLimit(`orders:post:${ip}`, 10, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, customerName, customerEmail, customerPhone, items, notes, paymentMethod } =
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
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array." }, { status: 400 });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim()) {
      return NextResponse.json({ error: `items[${i}].name is required.` }, { status: 400 });
    }
    if (typeof item.price !== "number" || item.price <= 0) {
      return NextResponse.json({ error: `items[${i}].price must be a positive number.` }, { status: 400 });
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return NextResponse.json({ error: `items[${i}].quantity must be a positive integer.` }, { status: 400 });
    }
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { published: true } });
  if (!site || !site.published) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const total = items.reduce(
    (sum: number, item: OrderItem) => sum + item.price * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      siteId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: typeof customerPhone === "string" ? customerPhone.trim() : null,
      items: JSON.stringify(items),
      total,
      status: "pending",
      paymentMethod: paymentMethod === "razorpay" ? "razorpay" : "cod",
      notes: typeof notes === "string" ? notes.trim() : null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, orderId: order.id, total }, { status: 201 });
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

  const orders = await prisma.order.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return NextResponse.json({
    orders,
    stats: { totalOrders: orders.length, totalRevenue, pendingOrders },
  });
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

  const { orderId, status } = (body ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }
  if (status !== "confirmed" && status !== "delivered" && status !== "cancelled") {
    return NextResponse.json({ error: "status must be 'confirmed', 'delivered', or 'cancelled'." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { site: { select: { userId: true } } },
  });
  if (!order || order.site.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json({ ok: true });
}
