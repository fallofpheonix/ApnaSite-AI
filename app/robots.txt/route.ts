import { NextRequest } from "next/server";

// GET /robots.txt — public storefronts (and their photos) are indexable;
// the logged-in app surface and the API are not crawl targets.
export function GET(req: NextRequest) {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /billing
Disallow: /login

Sitemap: ${req.nextUrl.origin}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
