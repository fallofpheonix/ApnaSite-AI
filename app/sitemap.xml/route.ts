import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// GET /sitemap.xml — the homepage plus every published storefront. A route
// handler (not app/sitemap.ts) so absolute URLs come from the request origin
// — no SITE_URL config needed, and it works behind a proxy (Next resolves
// x-forwarded-* into nextUrl).

function xmlEsc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const sites = await prisma.site.findMany({
    where: { published: true, slug: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const urls = [
    `<url><loc>${xmlEsc(origin)}/</loc></url>`,
    ...sites.map(
      (s) =>
        `<url><loc>${xmlEsc(`${origin}/s/${encodeURIComponent(s.slug!)}`)}</loc>` +
        `<lastmod>${s.updatedAt.toISOString()}</lastmod></url>`
    ),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
