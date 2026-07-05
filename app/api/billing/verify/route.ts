import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSubscription, razorpayConfigured, verifyCheckoutSignature } from "@/lib/razorpay";

// Statuses that must never be revived by a stale/replayed checkout callback.
const TERMINAL_STATUSES = new Set(["cancelled", "expired", "completed"]);

// POST /api/billing/verify — called by the browser after Razorpay Checkout
// reports success. The signature proves the success payload came from
// Razorpay. This gives the user instant Pro access; the webhook remains the
// authoritative record (it also handles renewals/cancellations later).
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let paymentId: string, subscriptionId: string, signature: string;
  try {
    const body = await req.json();
    paymentId = String(body.razorpay_payment_id ?? "");
    subscriptionId = String(body.razorpay_subscription_id ?? "");
    signature = String(body.razorpay_signature ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!paymentId || !subscriptionId || !signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  if (!verifyCheckoutSignature(paymentId, subscriptionId, signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Only flip the row that this user's subscribe call created.
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub || sub.razorpaySubscriptionId !== subscriptionId) {
    return NextResponse.json({ error: "No matching subscription." }, { status: 404 });
  }

  // A valid signature proves the payment event happened — it doesn't prove
  // the subscription is still alive. Never revive a terminal subscription
  // (e.g. a replayed success callback after the user cancelled).
  if (TERMINAL_STATUSES.has(sub.status)) {
    return NextResponse.json(
      { error: "This subscription has ended. Start a new upgrade from the billing page." },
      { status: 409 }
    );
  }

  // When API keys are configured, Razorpay's own record is authoritative.
  if (razorpayConfigured()) {
    try {
      const remote = await getSubscription(subscriptionId);
      if (!["authenticated", "active"].includes(remote.status)) {
        return NextResponse.json(
          { error: `Payment isn't confirmed yet (subscription is ${remote.status}).` },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error("Razorpay subscription lookup failed during verify:", err);
      return NextResponse.json(
        { error: "Couldn't confirm the subscription with Razorpay. Please try again." },
        { status: 502 }
      );
    }
  }

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: "active" },
  });

  return NextResponse.json({ ok: true });
}
