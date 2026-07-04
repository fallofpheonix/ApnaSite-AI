import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uniqueSlugFor } from "@/lib/slug";
import { planForUser, PLANS } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

// POST /api/sites/:id/publish — makes the site publicly visible at /s/<slug>.
// The rendered HTML is generated on request in /s/[slug], so publishing is
// just a flag flip plus (first time) claiming a unique slug.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  // Plan limit check — only when this would occupy a NEW published slot.
  // Re-publishing an already-live site (e.g. after an edit) is always fine.
  if (!site.published) {
    const [plan, publishedCount] = await Promise.all([
      planForUser(user.id),
      prisma.site.count({ where: { userId: user.id, published: true } }),
    ]);
    if (publishedCount >= plan.maxPublishedSites) {
      // 402 + a structured code so the UI can show the upgrade sheet instead
      // of a raw error message.
      return NextResponse.json(
        {
          error:
            plan.key === "free"
              ? `The free plan includes ${plan.maxPublishedSites} published site. Upgrade to Pro for up to ${PLANS.pro.maxPublishedSites}, or unpublish another site first.`
              : `Your plan allows up to ${plan.maxPublishedSites} published sites. Unpublish one first.`,
          code: "publish_limit_reached",
          plan: plan.key,
          limit: plan.maxPublishedSites,
        },
        { status: 402 }
      );
    }
  }

  // A site that was published before keeps its slug so the URL never changes.
  const slug = site.slug ?? (await uniqueSlugFor(site.name, site.id));

  await prisma.site.update({
    where: { id },
    data: { slug, published: true },
  });

  return NextResponse.json({ slug, url: `/s/${slug}` });
}
