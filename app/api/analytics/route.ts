import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = await rateLimit(`analytics:post:${ip}`, 100, 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, path, referrer } = (body ?? {}) as Record<string, unknown>;
  if (typeof siteId !== "string" || !siteId) {
    return NextResponse.json({ error: "siteId is required." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { published: true } });
  if (!site || !site.published) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  await prisma.pageview.create({
    data: {
      siteId,
      path: typeof path === "string" && path ? path : "/",
      referrer: typeof referrer === "string" ? referrer : null,
      ip,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
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

  const now = new Date();
  const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalViews, viewsToday, viewsThisWeek] = await Promise.all([
    prisma.pageview.count({ where: { siteId } }),
    prisma.pageview.count({ where: { siteId, createdAt: { gte: midnightUtc } } }),
    prisma.pageview.count({ where: { siteId, createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const pageviewRows = await prisma.pageview.findMany({
    where: { siteId, createdAt: { gte: thirtyDaysAgo } },
    select: { path: true, referrer: true, ip: true, createdAt: true },
  });

  const pathCounts = new Map<string, number>();
  const dateCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const uniqueVisitorBuckets = new Set<string>();

  for (const row of pageviewRows) {
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
    const dateStr = row.createdAt.toISOString().slice(0, 10);
    dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
    const visitorKey = row.ip || "unknown";
    const dayBucket = Math.floor(row.createdAt.getTime() / (24 * 60 * 60 * 1000));
    uniqueVisitorBuckets.add(`${visitorKey}:${dayBucket}`);
    if (row.referrer) {
      let referrer = row.referrer;
      try {
        const parsed = new URL(row.referrer);
        referrer = parsed.hostname.replace(/^www\./, "");
      } catch {
        referrer = row.referrer.slice(0, 120);
      }
      if (referrer) referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);
    }
  }

  const topPages = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const topReferrers = [...referrerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  const dailyViews: { date: string; count: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    dailyViews.push({ date: dateStr, count: dateCounts.get(dateStr) ?? 0 });
  }
  dailyViews.reverse();

  return NextResponse.json({
    totalViews,
    uniqueVisitors: uniqueVisitorBuckets.size,
    viewsToday,
    viewsThisWeek,
    topPages,
    topReferrers,
    dailyViews,
  });
}
