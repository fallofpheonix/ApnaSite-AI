import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { verifyCheckoutSignature } from "@/lib/razorpay";

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

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: "active" },
  });

  return NextResponse.json({ ok: true });
}
