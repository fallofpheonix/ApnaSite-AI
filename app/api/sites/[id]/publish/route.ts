import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uniqueSlugFor } from "@/lib/slug";
import { PAID_STATUSES, PLANS, type Plan } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };
const SLUG_RETRIES = 3;

// POST /api/sites/:id/publish — makes the site publicly visible at /s/<slug>.
// The rendered HTML is generated on request in /s/[slug], so publishing is
// just a flag flip plus (first time) claiming a unique slug.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  for (let attempt = 0; attempt < SLUG_RETRIES; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const site = await tx.site.findUnique({ where: { id } });
        if (!site || site.userId !== user.id) return { kind: "not_found" as const };

        const sub = await tx.subscription.findUnique({ where: { userId: user.id } });
        const plan: Plan =
          sub && PAID_STATUSES.has(sub.status) && PLANS[sub.planKey as Plan["key"]]
            ? PLANS[sub.planKey as Plan["key"]]
            : PLANS.free;

        // Plan limit check — only when this would occupy a NEW published slot.
        // Re-publishing an already-live site (e.g. after an edit) is always fine.
        if (!site.published) {
          const publishedCount = await tx.site.count({ where: { userId: user.id, published: true } });
          if (publishedCount >= plan.maxPublishedSites) {
            return { kind: "limit" as const, plan };
          }
        }

        // A site that was published before keeps its slug so the URL never changes.
        const slug = site.slug ?? (await uniqueSlugFor(site.name, site.id, tx));
        await tx.site.update({
          where: { id },
          data: { slug, published: true },
        });

        return { kind: "ok" as const, slug };
      });

      if (result.kind === "not_found") {
        return NextResponse.json({ error: "Site not found." }, { status: 404 });
      }
      if (result.kind === "limit") {
        // 402 + a structured code so the UI can show the upgrade sheet instead
        // of a raw error message.
        return NextResponse.json(
          {
            error:
              result.plan.key === "free"
                ? `The free plan includes ${result.plan.maxPublishedSites} published site. Upgrade to Pro for up to ${PLANS.pro.maxPublishedSites}, or unpublish another site first.`
                : `Your plan allows up to ${result.plan.maxPublishedSites} published sites. Unpublish one first.`,
            code: "publish_limit_reached",
            plan: result.plan.key,
            limit: result.plan.maxPublishedSites,
          },
          { status: 402 }
        );
      }

      return NextResponse.json({ slug: result.slug, url: `/s/${result.slug}` });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < SLUG_RETRIES - 1
      ) {
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Could not claim a public URL. Try again." }, { status: 409 });
}
