import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = await rateLimit(`reviews:post:${ip}`, 5, 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { siteId, author, rating, comment } = (body ?? {}) as Record<string, unknown>;

  if (typeof siteId !== "string" || !siteId) {
    return NextResponse.json({ error: "siteId is required." }, { status: 400 });
  }
  if (typeof author !== "string" || !author.trim()) {
    return NextResponse.json({ error: "author is required." }, { status: 400 });
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be an integer between 1 and 5." }, { status: 400 });
  }
  if (typeof comment !== "string" || !comment.trim() || comment.length > 2000) {
    return NextResponse.json({ error: "comment is required and must be ≤2000 characters." }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { published: true } });
  if (!site || !site.published) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  await prisma.review.create({
    data: {
      siteId,
      author: author.trim(),
      rating,
      comment: comment.trim(),
      approved: false,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId query param required." }, { status: 400 });

  const user = await getSessionUser(req);

  if (user) {
    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
    if (!site || site.userId !== user.id) {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { siteId } }),
      prisma.review.aggregate({ where: { siteId }, _avg: { rating: true } }),
    ]);

    const pending = await prisma.review.count({ where: { siteId, approved: false } });
    return NextResponse.json({
      reviews,
      stats: {
        total,
        pending,
        average: aggregate._avg.rating ?? 0,
      },
    });
  }

  const reviews = await prisma.review.findMany({
    where: { siteId, approved: true },
    orderBy: { createdAt: "desc" },
  });

  const aggregate = await prisma.review.aggregate({
    where: { siteId, approved: true },
    _avg: { rating: true },
  });

  return NextResponse.json({
    reviews,
    averageRating: aggregate._avg.rating ?? 0,
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

  const { reviewId, approved } = (body ?? {}) as Record<string, unknown>;
  if (typeof reviewId !== "string" || !reviewId) {
    return NextResponse.json({ error: "reviewId is required." }, { status: 400 });
  }
  if (typeof approved !== "boolean") {
    return NextResponse.json({ error: "approved must be a boolean." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { site: { select: { userId: true } } },
  });
  if (!review || review.site.userId !== user.id) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  await prisma.review.update({ where: { id: reviewId }, data: { approved } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let reviewId: string | null = null;

  if (req.method === "DELETE") {
    const url = req.nextUrl;
    reviewId = url.searchParams.get("reviewId");
  }

  if (!reviewId) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    reviewId = ((body ?? {}) as Record<string, unknown>).reviewId as string | null;
  }

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { site: { select: { userId: true } } },
  });
  if (!review || review.site.userId !== user.id) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
