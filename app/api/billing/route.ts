import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { planForUser, PLANS } from "@/lib/plans";
import { razorpayConfigured } from "@/lib/razorpay";

// GET /api/billing — everything the /billing page needs in one call.
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const [plan, subscription, publishedCount] = await Promise.all([
    planForUser(user.id),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.site.count({ where: { userId: user.id, published: true } }),
  ]);

  return NextResponse.json({
    plans: PLANS,
    currentPlan: plan.key,
    publishedCount,
    checkoutEnabled: razorpayConfigured(),
    subscription: subscription
      ? {
          status: subscription.status,
          planKey: subscription.planKey,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  });
}
