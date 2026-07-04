import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

// POST /api/billing/webhook — Razorpay server-to-server notifications.
// This is the authoritative source of subscription state: it fires on
// activation, every renewal charge, payment failures (halted) and
// cancellations, regardless of whether the user's browser survived checkout.
//
// Security: NO session auth here (Razorpay calls it), so the HMAC signature
// over the RAW body is the only gate. Never parse-then-reverify — byte-exact
// body first.
//
// Register in the Razorpay dashboard: Settings → Webhooks → your-domain/api/
// billing/webhook, and put the same secret in RAZORPAY_WEBHOOK_SECRET.

// Razorpay event → our Subscription.status. Events we don't track are
// acknowledged with 200 and ignored (Razorpay retries non-2xx responses).
const STATUS_BY_EVENT: Record<string, string> = {
  "subscription.authenticated": "authenticated",
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.halted": "halted", // renewal payments failing → paid features off
  "subscription.cancelled": "cancelled",
  "subscription.completed": "completed",
  "subscription.expired": "expired",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: string;
  let entity: { id?: string; status?: string; current_end?: number | null };
  try {
    const payload = JSON.parse(rawBody);
    event = String(payload.event ?? "");
    entity = payload?.payload?.subscription?.entity ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const status = STATUS_BY_EVENT[event];
  if (!status || !entity.id) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const updated = await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: entity.id },
    data: {
      status,
      currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined,
    },
  });

  // Unknown subscription id: acknowledge anyway (could be a dashboard-created
  // test subscription) but say so for debugging.
  return NextResponse.json({ ok: true, matched: updated.count });
}
