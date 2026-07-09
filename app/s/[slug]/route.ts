import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { renderStorefrontHTML } from "@/lib/renderSite";
import { planForUser } from "@/lib/plans";
import { validStorefront } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

// GET /s/:slug — the public storefront. Deliberately unauthenticated: this is
// the page shop owners share with their customers. Everything else in the app
// requires a session.
export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site || !site.published) {
    return new Response("<h1>Site not found</h1><p>This site doesn't exist or has been unpublished.</p>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // The request URL gives us the canonical absolute address for og:url /
  // og:image (works behind a proxy too, since Next respects x-forwarded-*).
  // The owner's plan decides whether the "Made with ApnaSite" badge shows.
  let data: unknown;
  try {
    data = JSON.parse(site.data);
  } catch {
    console.error("Published site has invalid JSON:", site.id);
    return new Response("<h1>Site unavailable</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (!validStorefront(data)) {
    console.error("Published site has invalid storefront data:", site.id);
    return new Response("<h1>Site unavailable</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Load reviews for this site
  const reviewRows = await prisma.review.findMany({
    where: { siteId: site.id, approved: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { author: true, rating: true, comment: true, createdAt: true },
  });
  const reviews = reviewRows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  // Extract appointment services from products
  const appointmentServices = data.products.map((p) => p.name);

  const ownerPlan = await planForUser(site.userId);
  const html = renderStorefrontHTML(data, {
    pageUrl: req.nextUrl.href,
    showBadge: ownerPlan.showBadge,
    reviews,
    appointmentServices,
    enableOrders: data.products.some((p) => p.price),
  });
  const finalHtml = html.replace(/__SITE_ID__/g, site.id);
  return new Response(finalHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
