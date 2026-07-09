import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { planForUser } from "@/lib/plans";
import { createSubscription, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";

// POST /api/billing/subscribe — creates a Razorpay subscription in "created"
// state and hands the id to the browser, which opens Razorpay Checkout with
// it. Payment success is confirmed by /api/billing/verify (checkout callback
// signature) and, authoritatively, by the webhook.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured on this server yet (missing Razorpay test keys)." },
      { status: 503 }
    );
  }

  const byUser = await rateLimit(`billing:user:${user.id}`, 10, 10 * 60 * 1000);
  const byIp = await rateLimit(`billing:ip:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!byUser.ok || !byIp.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const plan = await planForUser(user.id);
  if (plan.key === "pro") {
    return NextResponse.json({ error: "You're already on Pro." }, { status: 400 });
  }

  // Idempotency: an abandoned checkout leaves a "created" subscription both
  // here and at Razorpay. Reopening checkout with the same id resumes it
  // instead of minting a fresh subscription per click.
  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (existing && existing.status === "created") {
    return NextResponse.json({
      subscriptionId: existing.razorpaySubscriptionId,
      keyId: razorpayKeyId(),
    });
  }

  try {
    const sub = await createSubscription(user.id);

    // Upsert so an abandoned earlier checkout doesn't block a fresh attempt.
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { razorpaySubscriptionId: sub.id, status: sub.status, planKey: "pro" },
      create: {
        userId: user.id,
        razorpaySubscriptionId: sub.id,
        status: sub.status, // "created" — NOT a paid status; plan stays free
        planKey: "pro",
      },
    });

    return NextResponse.json({ subscriptionId: sub.id, keyId: razorpayKeyId() });
  } catch (err) {
    console.error("Razorpay subscription create failed:", err);
    return NextResponse.json(
      { error: "Couldn't start the payment. Please try again." },
      { status: 502 }
    );
  }
}
