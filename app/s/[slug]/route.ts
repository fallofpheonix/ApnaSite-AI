import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { renderStorefrontHTML } from "@/lib/renderSite";
import { planForUser } from "@/lib/plans";

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
  // The owner's plan decides whether the "Made with VoxSite" badge shows.
  const ownerPlan = await planForUser(site.userId);
  const html = renderStorefrontHTML(JSON.parse(site.data), {
    pageUrl: req.nextUrl.href,
    showBadge: ownerPlan.showBadge,
  });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Small cache so repeat visits are fast but edits show up quickly.
      "Cache-Control": "public, max-age=60",
    },
  });
}
